import "server-only";

// Server-only client for PostHog's Query API (HogQL), used by the admin
// dashboard. The personal API key must never reach the browser, which is why
// this file imports "server-only".

export class PostHogNotConfiguredError extends Error {
  constructor() {
    super("PostHog query credentials are not configured");
  }
}

export class PostHogQueryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    // PostHog's explanation (e.g. a HogQL syntax error). Server-side logs
    // only: never show it to the browser.
    readonly detail?: string,
  ) {
    super(message);
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const REQUEST_TIMEOUT_MS = 15_000;

type CacheEntry = { expires: number; rows: Promise<unknown[][]> };

// On globalThis (like lib/rateLimit.ts) so server actions and pages, which are
// separate bundles in the same process, share one cache
const globalForCache = globalThis as unknown as {
  __posthogQueryCache?: Map<string, CacheEntry>;
};

const cache = (globalForCache.__posthogQueryCache ??= new Map());

const getConfig = () => {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) throw new PostHogNotConfiguredError();

  // The key is sent to this host, so refuse anything that isn't a plain
  // https origin, and keep the project id from altering the request path
  if (!/^\d+$/.test(projectId))
    throw new PostHogQueryError("POSTHOG_PROJECT_ID must be a number");

  const url = new URL(process.env.POSTHOG_HOST ?? "https://us.posthog.com");

  if (url.protocol !== "https:")
    throw new PostHogQueryError("POSTHOG_HOST must be an https URL");

  return { apiKey, projectId, host: url.origin };
};

const fetchRowsOnce = async (
  { apiKey, projectId, host }: ReturnType<typeof getConfig>,
  query: string,
) => {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "admin-dashboard",
      query: { kind: "HogQLQuery", query },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
    // Never follow a redirect with the key attached
    redirect: "error",
  });

  // The message carries only the status; the (truncated) body is kept in
  // `detail` for the server log. The API key is never part of either.
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 500);

    throw new PostHogQueryError(
      `PostHog query failed (HTTP ${response.status})`,
      response.status,
      detail,
    );
  }

  const json = (await response.json()) as { results?: unknown };

  if (!Array.isArray(json.results))
    throw new PostHogQueryError("PostHog returned an unexpected response");

  return json.results as unknown[][];
};

// PostHog occasionally answers a perfectly good query with a 5xx (for example
// "max execution time" on a cold start), so try once more before giving up.
// 4xx answers (bad key, rate limit, syntax error) are never retried.
const fetchRows = async (
  config: ReturnType<typeof getConfig>,
  query: string,
): Promise<unknown[][]> => {
  try {
    return await fetchRowsOnce(config, query);
  } catch (error) {
    if (!(error instanceof PostHogQueryError) || (error.status ?? 0) < 500)
      throw error;

    await new Promise((resolve) => setTimeout(resolve, 750));

    return fetchRowsOnce(config, query);
  }
};

// Runs a HogQL query and returns its rows. Results are cached for 5 minutes
// (admin-only, low traffic, and PostHog rate-limits its query API). Callers
// must build `query` from constants only, never from request input.
export const runHogQL = async (query: string): Promise<unknown[][]> => {
  const config = getConfig();
  const cacheKey = `${config.projectId}:${query}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > now) return cached.rows;

  const rows = fetchRows(config, query);

  cache.set(cacheKey, { expires: now + CACHE_TTL_MS, rows });

  // A failed query must not stay cached
  rows.catch(() => {
    if (cache.get(cacheKey)?.rows === rows) cache.delete(cacheKey);
  });

  // Keep the cache bounded: drop expired entries, then the oldest ones
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;

    if (oldest === undefined) break;
    cache.delete(oldest);
  }

  return rows;
};

// HogQL string literal
export const hogqlString = (value: string) =>
  `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

// A UTC instant as a HogQL DateTime expression
export const hogqlTimestamp = (date: Date) =>
  `toDateTime(${hogqlString(date.toISOString().slice(0, 19).replace("T", " "))}, 'UTC')`;

export const toNumber = (value: unknown) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};
