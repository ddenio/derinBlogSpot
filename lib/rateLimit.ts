// Simple in-memory sliding-window rate limiter.
//
// State lives in the Node process, so it resets when the server restarts and
// is not shared between multiple instances. That's fine for a single Render
// instance (the current setup). If the app is ever scaled to several
// instances, swap the store for Redis/Upstash or a database table.

type Store = Map<string, number[]>;

const globalForLimiter = globalThis as unknown as {
  __rateLimitStore?: Store;
  __rateLimitCleanup?: boolean;
};

// globalThis so server actions and route handlers (separate bundles in the
// same process) share one store
const store: Store =
  globalForLimiter.__rateLimitStore ??
  (globalForLimiter.__rateLimitStore = new Map());

const KEEP_FOR_MS = 60 * 60 * 1000;

if (!globalForLimiter.__rateLimitCleanup) {
  globalForLimiter.__rateLimitCleanup = true;

  // Drop keys with no recent hits so the map can't grow forever
  const timer = setInterval(
    () => {
      const cutoff = Date.now() - KEEP_FOR_MS;

      for (const [key, hits] of store) {
        if (!hits.length || hits[hits.length - 1] < cutoff) store.delete(key);
      }
    },
    10 * 60 * 1000,
  );

  timer.unref?.();
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/**
 * Records one attempt for `key` and reports whether it is allowed.
 * `limit` attempts are allowed per `windowMs`.
 */
export const rateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    store.set(key, hits);

    return {
      ok: false as const,
      retryAfterSec: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  store.set(key, hits);

  return { ok: true as const, retryAfterSec: 0 };
};

/** Forget a key, e.g. after a successful login. */
export const resetRateLimit = (key: string) => {
  store.delete(key);
};

/**
 * Best-effort client IP. The first X-Forwarded-For entry can be spoofed by a
 * client, so IP limits are only a second layer; per-email/per-user limits are
 * the ones attackers can't dodge.
 */
export const ipFromHeaders = (headers: Headers) => {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    forwarded ??
    "unknown"
  );
};

/** "Too many attempts. Try again in 5 minutes." */
export const tooManyMessage = (retryAfterSec: number) => {
  const minutes = Math.ceil(retryAfterSec / 60);

  return `Too many attempts. Please try again in ${
    minutes <= 1 ? "a minute" : `${minutes} minutes`
  }.`;
};
