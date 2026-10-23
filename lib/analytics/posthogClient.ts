// Browser-side PostHog. Import this only from client components.
//
// Privacy setup (the Privacy Policy describes exactly this, so change both
// together):
//  - persistence "memory": nothing is written to cookies or localStorage
//  - requests go through our own /ingest proxy (app/ingest/[...path]) which
//    never forwards our cookies
//  - page addresses are sent WITHOUT their query string (it can hold secret
//    email-verification / password-reset tokens)
//  - no autocapture, session replay, heatmaps, surveys or feature flags
//  - Do Not Track is respected
//  - site administrators are never tracked
//  - logged-in users are identified by their random user id only

import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Properties (on the event and on the person) that hold full page addresses
const URL_PROPERTIES = [
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
];

let initialized = false;
// false while an administrator is signed in
let enabled = true;
let identifiedId: string | null = null;

const stripQueryAndHash = (value: unknown) =>
  typeof value === "string" ? value.split(/[?#]/)[0] : value;

// Runs on every event just before it is sent
const beforeSend = (event: CaptureResult) => {
  // Covers an admin logging in after the SDK has already started
  if (!enabled) return null;

  [event.properties, event.$set, event.$set_once].forEach((bag) => {
    if (!bag) return;

    URL_PROPERTIES.forEach((key) => {
      if (key in bag) bag[key] = stripQueryAndHash(bag[key]);
    });
  });

  return event;
};

export const syncAnalytics = (userId: string | undefined, isAdmin: boolean) => {
  // No key (local dev, preview builds): analytics is a no-op
  if (!POSTHOG_KEY) return;

  enabled = !isAdmin;

  if (!enabled) {
    // An admin signed in on a page that was tracking someone else: forget them
    if (initialized && identifiedId) {
      posthog.reset();
      identifiedId = null;
    }

    return;
  }

  if (!initialized) {
    initialized = true;

    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      // Pageviews on every App Router navigation, not just the first load
      defaults: "2025-05-24",
      persistence: "memory",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_exceptions: false,
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      respect_dnt: true,
      before_send: beforeSend,
    });
  }

  if (userId && userId !== identifiedId) {
    posthog.identify(userId);
    identifiedId = userId;
  } else if (!userId && identifiedId) {
    // Logged out: later events must not be attributed to the previous user
    posthog.reset();
    identifiedId = null;
  }
};

// Events fired before syncAnalytics has run are dropped. That is fine today:
// the root layout passes the server session to SessionProvider, so
// PostHogProvider's effect runs on the first render, before any page's.
export const trackClientEvent = (
  event: string,
  properties?: Record<string, string | number | boolean>,
) => {
  if (!initialized || !enabled) return;

  posthog.capture(event, properties);
};
