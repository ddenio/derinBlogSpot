import "server-only";

import { PostHog } from "posthog-node";
import { POSTHOG_API_HOST } from "./ingestProxy";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let client: PostHog | null = null;

const getClient = () => {
  // No key (local dev, preview builds): analytics is a no-op
  if (!POSTHOG_KEY) return null;

  client ??= new PostHog(POSTHOG_KEY, {
    host: POSTHOG_API_HOST,
    // Send straight away; the server is long-running but events are rare
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
};

// Records a server-side event for a signed-in user, keyed by their random
// user id. Properties must never contain an email, name or other personal
// data. Never throws and never makes the caller wait: analytics must not be
// able to break sign-up or publishing.
export const trackServerEvent = (
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean>,
) => {
  try {
    getClient()?.capture({
      distinctId,
      event,
      // `environment` lets the admin dashboard tell real production events
      // from ones sent by a developer's local server (which shares the
      // PostHog project)
      properties: { ...properties, environment: process.env.NODE_ENV },
      // These events come from our server, not the visitor's browser, so
      // don't let PostHog place the user at the server's location
      disableGeoip: true,
    });
  } catch (error) {
    console.error(`Analytics event "${event}" failed:`, error);
  }
};
