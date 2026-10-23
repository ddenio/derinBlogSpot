# Feature: Part 3 of 3: Admin Analytics Dashboard - PostHog traffic section

> Split from `.ai/specs/2026-10-22-admin-analytics-dashboard.combined.md` (kept as reference; do not `/implement` it). Implement the three parts in order, each on its own branch stacked on the previous part.

## Feature Description

Turn the admin page (`/admin`, currently two numbers: users and blogs) into a real analytics dashboard with two sources of data, shown as stat tiles plus time-series charts, all controlled by one 7 / 30 / 90-day range toggle:

1. **Site activity (own database, no new tracking):** signups, published blogs, claps, comments, bookmarks and follows over time; top blogs, top authors, popular tags, sign-in method split, verified-vs-unverified users, draft-vs-published ratio.
2. **Traffic and behavior (PostHog Cloud, US region):** pageviews and visitors over time, views per blog, top referrers (so the LinkedIn post can be measured), top countries, and a signup funnel (signed up → verified email → published a blog).

PostHog is wired in privacy-first: cookieless (in-memory identity only, no cookies / localStorage, no consent banner), routed through a first-party reverse proxy (`/ingest`) so the Content Security Policy does not need to be loosened and ad-blockers do not drop events, admin traffic is excluded, Do Not Track is respected, and the Privacy Policy is updated to describe it.

## User Story

As the site owner (admin)
I want to see how many people sign up, publish, engage and visit, and where they come from, over a time range I choose
So that I can tell what is working, measure the impact of sharing the site (e.g. on LinkedIn), and show the project off with real numbers.

## Problem Statement

The admin page only shows `db.user.count()` and `db.blog.count()`. The database already holds rich time-stamped activity (every `User`, `Blog`, `Clap`, `Comment`, `Bookmark`, `Follow` has `createdAt`) that is unused, and there is no visitor tracking at all, so it is impossible to know who visits without signing up, which posts are viewed, or whether traffic from outside sources arrives. The Privacy Policy currently states "We don't use advertising or analytics trackers", so any tracking must also be disclosed.

## Solution Statement

- **Phase 1 (own data):** replace `getCounts` with a range-aware server action that runs grouped daily queries against Prisma/Postgres, and rebuild `AdminDashboard` as a server component with a URL-driven range toggle (`/admin?range=30`), tile components, a reusable recharts-based time-series chart client component, and simple ranked lists. No schema change.
- **Phase 2 (collect):** add `posthog-js` (client, cookieless, admin-excluded) and `posthog-node` (server events keyed by user id), the `/ingest` reverse proxy in `next.config.ts`, exempt `/ingest` from the auth middleware, fire `blog_viewed` on blog pages and `user_signed_up` / `email_verified` / `blog_published` on the server, and update the Privacy Policy.
- **Phase 3 (display):** a server-only HogQL client (PostHog Query API, personal API key, 5-minute in-memory cache) feeds a second dashboard section. Each section sits in its own `<Suspense key={range}>` so a slow or failing PostHog call never blocks or breaks the database section.

Design decisions (confirmed with the user): cookieless / no banner; PostHog US region (`us.posthog.com`, ingestion `us.i.posthog.com`, assets `us-assets.i.posthog.com`).

## Depends On

Part 1 (dashboard shell, range utilities, chart components) and Part 2 (events must be flowing into PostHog). Build on top of the branch from `2026-10-22-admin-analytics-dashboard-part-2-posthog-collection.md`.

## Relevant Files

Use these files to implement this part:

- `components/admin/AdminDashboard.tsx` - add the second Suspense section.
- `app/admin/page.tsx` - already passes `range` (from Part 1).
- `lib/analytics/range.ts`, `lib/analytics/events.ts` - reused (`fillDailySeries`, event constants).
- `components/admin/StatTile.tsx`, `TimeSeriesChart.tsx`, `RankedList.tsx`, `SectionSkeleton.tsx` - reused from Part 1.
- `lib/siteInfo.ts` - `SITE_URL` host, used to exclude own-site referrers.
- `lib/db.ts` - join blog titles for top blogs.
- `lib/rateLimit.ts` - reference pattern for the `globalThis` TTL cache.
- `actions/admin/getDbAnalytics.ts` - pattern for the admin-gated action.

### New Files

- `lib/analytics/posthogQuery.ts`
- `actions/admin/getTrafficAnalytics.ts`
- `components/admin/TrafficAnalyticsSection.tsx`
- `components/admin/FunnelBars.tsx` - server component: horizontal funnel with step counts and step-to-step conversion %, empty state ("No data yet"). Moved here from Part 1 because this is its first use.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. PostHog query client

- Create `lib/analytics/posthogQuery.ts` (server-only: `import "server-only"` at the top (package installed in Part 2), so the personal API key can never be bundled into client code; the same applies to `lib/analytics/posthogServer.ts`): `runHogQL<T>(query: string)` posting `{ query: { kind: "HogQLQuery", query }, name: "admin-dashboard" }` to `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/` with `Authorization: Bearer ${POSTHOG_PERSONAL_API_KEY}`, an `AbortSignal.timeout(10_000)`, and a `globalThis` TTL cache (5 minutes, keyed by query string, bounded size) mirroring `lib/rateLimit.ts`. Throw a typed error when env vars are missing so the UI can show "PostHog is not configured".
- Add `runFunnel(steps, days)` posting a `FunnelsQuery` (`series` of `EventsNode`s, `dateRange.date_from: "-${days}d"`, 30-day conversion window). Verify the response shape against the live API during implementation; if it differs, fall back to `count(DISTINCT distinct_id)` per event via HogQL and document the non-strict ordering.
- Query strings contain only constants and the allowlisted integer `days`; never interpolate request input.

### 2. Traffic analytics server action

- Create `actions/admin/getTrafficAnalytics.ts` (`"use server"`, same admin check and `{ error } | { success }` shape; accepts `days: Range`). Run in parallel:
  - Totals with previous-period comparison: pageviews, visitors (`count(DISTINCT person_id)`), blog views, over `2 * days` with `countIf`.
  - Daily series: `toStartOfDay(timestamp)` grouped `countIf($pageview)`, `count(DISTINCT person_id)`, `countIf(blog_viewed)`, padded with `fillDailySeries`.
  - Top blogs: `properties.blog_id` for `blog_viewed`, limit 10, then one `db.blog.findMany({ where: { id: { in: ids }, isPublished: true }, select: { id, title } })` to attach titles (drop ids that no longer exist).
  - Top referrers: distinct visitors by `properties.$referring_domain`, excluding the site's own host from `SITE_URL` and mapping `$direct` to "Direct".
  - Top countries: distinct visitors by `properties.$geoip_country_name` (hide the card if everything is empty).
  - Funnel: `USER_SIGNED_UP` -> `EMAIL_VERIFIED` -> `BLOG_PUBLISHED`.

### 3. Traffic section UI

- Create `components/admin/TrafficAnalyticsSection.tsx` (async server component): tiles (Visitors, Pageviews, Blog views), visitors/pageviews and blog-views charts, top blogs (links to `/blog/<id>`), referrers, countries, `FunnelBars`. A short hint explains that cookieless tracking counts a returning visitor again on a new visit, so "Visitors" is approximate. Error states: missing configuration -> informational `Alert`; API failure -> error `Alert`; neither affects the database section.
- Add it to `AdminDashboard.tsx` as a second `<Suspense key={range} fallback={<SectionSkeleton />}>` below the database section, with a section heading for each.

### 4. Cleanup

- Remove any unused helper or import introduced while iterating.

### 5. Final validation

- Run every command in `Validation Commands`, then do the manual checklist from the Testing Strategy in light and dark mode, desktop and phone width.

## Testing Strategy

Manual: with PostHog env vars set, the traffic numbers match PostHog's own UI within the cache window and the funnel counts a test signup -> verify -> publish; without env vars the section shows the "not configured" message and no request is made; with a bad key it shows an error while the DB section still renders. Edge cases: zero events (no divide-by-zero in deltas or funnel percentages), a blog deleted after being viewed disappears from "top blogs", the funnel response shape differs from expectation (fall back to per-event distinct counts), narrow phone width.

## Acceptance Criteria

- The "Traffic" section shows visitors, pageviews and blog views with change vs previous period, a visitors/pageviews chart, a blog views chart, top blogs by views (linked, titles from the DB), top referrers, top countries (when available) and the signup -> verified -> published funnel with step conversion rates, all driven by the same 7/30/90 toggle.
- A PostHog outage, bad key or missing configuration degrades only the traffic section; the database section is unaffected.
- The personal API key never reaches client code (`server-only` imports); query strings contain only constants and the allowlisted integer `days`.
- Results are cached for 5 minutes in memory.
- `npx tsc --noEmit`, ESLint and `npm run build` pass.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

(The repo has no CLAUDE.md. `npm run lint` is broken because Next 16 removed `next lint`. A full `npx eslint .` does pass at baseline but takes over 4 minutes, so lint the source directories explicitly.)

- `npx tsc --noEmit` - type check (clean at baseline).
- `npx eslint app components actions lib context schemas auth.ts auth.config.ts proxy.ts routes.ts next.config.ts` - lint the source.
- `npx prisma generate` - Prisma client still generates (no schema change expected).
- `npm run build` - production build succeeds (catches server/client boundary mistakes such as importing `posthog-node` or `lib/analytics/posthogQuery.ts` into a client component).
- `npm run dev`, then manually run the checklist in Testing Strategy.
- `npm audit --omit=dev` - review any advisories introduced by the new dependencies.

## Notes

See the Notes section of `2026-10-22-admin-analytics-dashboard.combined.md` for cookieless trade-offs, one-time PostHog setup, env vars, and possible later additions.

**For UI features:** Use the `frontend-design` skill during `/implement` for high-quality, distinctive interfaces.
