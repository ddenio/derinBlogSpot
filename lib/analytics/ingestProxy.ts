// Helpers for the /ingest reverse proxy (app/ingest/[...path]/route.ts).
//
// Why a route handler instead of a plain next.config.ts rewrite: a rewrite
// forwards every request header to PostHog, including the Auth.js session
// cookie. Here only the headers PostHog needs are passed on, and nothing the
// service sends back can set cookies on our domain.

export const INGEST_PREFIX = "/ingest";

export const POSTHOG_API_HOST = "https://us.i.posthog.com";
export const POSTHOG_ASSETS_HOST = "https://us-assets.i.posthog.com";

// Analytics payloads are tiny; refuse anything larger
export const MAX_BODY_BYTES = 1_000_000;

const ASSET_PREFIXES = ["/static/", "/array/"];

// Deliberately NOT included: cookie, authorization, referer, origin
const FORWARDED_REQUEST_HEADERS = ["content-type", "user-agent", "accept"];

const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control"];

// "/ingest/e/?ip=0" -> "https://us.i.posthog.com/e/?ip=0"
export const getUpstreamUrl = (pathname: string, search: string) => {
  const path = pathname.slice(INGEST_PREFIX.length) || "/";
  const host = ASSET_PREFIXES.some((prefix) => path.startsWith(prefix))
    ? POSTHOG_ASSETS_HOST
    : POSTHOG_API_HOST;

  return `${host}${path}${search}`;
};

export const buildUpstreamHeaders = (incoming: Headers, clientIp: string) => {
  const headers = new Headers();

  FORWARDED_REQUEST_HEADERS.forEach((name) => {
    const value = incoming.get(name);

    if (value) headers.set(name, value);
  });

  // PostHog uses this to work out the visitor's country
  if (clientIp !== "unknown") headers.set("x-forwarded-for", clientIp);

  return headers;
};

export const buildClientHeaders = (upstream: Headers) => {
  const headers = new Headers();

  FORWARDED_RESPONSE_HEADERS.forEach((name) => {
    const value = upstream.get(name);

    if (value) headers.set(name, value);
  });

  return headers;
};
