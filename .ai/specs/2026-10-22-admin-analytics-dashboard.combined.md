# Feature: Admin Analytics Dashboard (site stats + PostHog traffic)

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

## Relevant Files

Use these files to implement the feature:

- `app/admin/page.tsx` - admin gate (role check) and entry point; must read the async `searchParams` for `range`.
- `components/admin/AdminDashboard.tsx` - current 2-tile dashboard; rewritten as the layout shell (header, range toggle, two Suspense sections).
- `actions/admin/getCounts.ts` - current admin-only server action and the pattern to follow (`auth()` + `role === "ADMIN"` check, `{ error } | { success }` return shape, try/catch). Replaced by `getDbAnalytics.ts` (delete this file, no compat shim).
- `components/common/Heading.tsx`, `components/common/Alert.tsx`, `components/layout/Container.tsx` - existing UI building blocks reused by the dashboard.
- `components/ui/button.tsx` (`buttonVariants`) - styles the range toggle links.
- `prisma/schema.prisma` - source of truth for the queryable tables (`User`, `Blog`, `Clap`, `Comment`, `Bookmark`, `Follow`, `Account`). No schema changes; table names are the model names (`"Blog"`, `"User"`), columns are camelCase and need quoting in raw SQL. The repo has no `prisma/migrations` folder (schema is pushed), so nothing to migrate.
- `lib/db.ts` - Prisma client with Neon adapter (`db.$queryRaw` is used for the grouped queries).
- `app/globals.css` - `--chart-1..5` are currently all neutral greys (chart-1 is nearly invisible on a white background); must be replaced with distinguishable colors for both `:root` and `.dark`.
- `next.config.ts` - add `rewrites()` for the `/ingest` reverse proxy and `skipTrailingSlashRedirect`; the CSP stays unchanged because the proxy keeps everything same-origin (`script-src 'self'`, `connect-src 'self'`).
- `proxy.ts` - this is the Next 16 middleware; its matcher currently runs on every non-static path, so unauthenticated visitors' `/ingest/*` requests would be redirected to `/login`. The matcher must exclude `ingest`.
- `app/layout.tsx` - mounts providers; the PostHog provider goes inside `SessionProvider` so it can read the session (admin exclusion, identify).
- `app/blog/(details)/[id]/page.tsx` - public blog page; gets the `blog_viewed` tracker.
- `actions/auth/register.ts` - credentials sign-up; fires `user_signed_up`.
- `actions/auth/email-verification.ts` - fires `email_verified` on the sign-up verification branch only (not the change-email branch).
- `auth.ts` - Auth.js `events` block (already has `linkAccount`); `createUser` fires only for OAuth sign-ups (credentials users are created directly in `register.ts`), so it fires `user_signed_up` for OAuth, and `linkAccount` also fires `email_verified`.
- `actions/blogs/create-blog.ts`, `actions/blogs/edit-blog.ts` - fire `blog_published` (create: when `isPublished`; edit: when `!blog.isPublished && isPublished`).
- `app/privacy/page.tsx` - sections 2, 4, 5, 6, 7, 8 and 9 mention (or contradict) analytics and must be updated.
- `lib/siteInfo.ts` - `LEGAL_LAST_UPDATED` bump; new `ANALYTICS_RETENTION` constant used by the policy.
- `lib/rateLimit.ts` - reference for the repo's in-memory-state-on-`globalThis` pattern, reused for the PostHog query cache.
- `package.json` - new dependencies: `recharts` (via shadcn `chart`), `posthog-js`, `posthog-node`. Note: `npm run lint` is broken (`next lint` was removed in Next 16), use `npx eslint <dirs>` instead (see Validation Commands).

### New Files

- `lib/analytics/range.ts` - `RANGES = [7, 30, 90]`, `parseRange(value)` (allowlist, default 30), `getRangeStart(days)`, `fillDailySeries(rows, days)` (fills missing UTC days with zeros), `formatDay`.
- `lib/analytics/events.ts` - shared event-name constants (`USER_SIGNED_UP`, `EMAIL_VERIFIED`, `BLOG_PUBLISHED`, `BLOG_VIEWED`) used by client, server and HogQL queries.
- `lib/analytics/posthogServer.ts` - `trackServerEvent(distinctId, event, properties?)`, a never-throwing, fire-and-forget `posthog-node` wrapper that no-ops when the key is missing.
- `lib/analytics/posthogQuery.ts` - `runHogQL(query)` / `runFunnel(steps, days)` against the PostHog Query API with auth header, timeout, 5-minute `globalThis` TTL cache.
- `actions/admin/getDbAnalytics.ts` - admin-only server action returning tiles, daily series, and rankings for a range.
- `actions/admin/getTrafficAnalytics.ts` - admin-only server action returning PostHog tiles, daily series, top blogs (titles joined from the DB), referrers, countries and the funnel.
- `components/admin/RangeToggle.tsx` - 7 / 30 / 90 segmented control made of `Link`s (`?range=`).
- `components/admin/StatTile.tsx` - value + label + optional "vs previous period" delta + optional hint.
- `components/admin/TimeSeriesChart.tsx` - `"use client"` recharts line/area chart in a card (multi-series, theme-aware, accessible title/summary).
- `components/admin/RankedList.tsx` - list with proportional bars (top blogs / authors / tags / referrers / countries).
- `components/admin/FunnelBars.tsx` - horizontal funnel with step counts and step-to-step conversion %.
- `components/admin/DbAnalyticsSection.tsx` - async server component rendering the database section.
- `components/admin/TrafficAnalyticsSection.tsx` - async server component rendering the PostHog section (with its own error state).
- `components/admin/SectionSkeleton.tsx` - Suspense fallback.
- `components/ui/chart.tsx` - shadcn chart wrapper, added through `npx shadcn@latest add chart` (also installs `recharts`).
- `components/analytics/PostHogProvider.tsx` - `"use client"`; initializes `posthog-js` once, skips admins, identifies logged-in users by user id.
- `components/analytics/BlogViewTracker.tsx` - `"use client"`; captures `blog_viewed` with `blog_id` on mount.

## Implementation Plan

### Phase 1: Foundation + site activity from the database (Section 1)

Chart infrastructure (shadcn chart + recharts, readable chart colors in both themes), shared range utilities, the DB analytics server action, the reusable tile / chart / ranked-list components, and the rebuilt admin page with the URL-driven range toggle. Fully shippable on its own: no tracking, no privacy changes, no new env vars.

### Phase 2: PostHog collection (proxy, tracking, privacy policy)

Install PostHog SDKs, add the reverse proxy and middleware exemption, initialize cookieless client tracking (admins excluded, DNT respected, identify by user id), fire `blog_viewed` and the three server-side funnel events, and update the Privacy Policy and its "last updated" date. After this phase PostHog starts receiving data even though the dashboard does not show it yet.

### Phase 3: Traffic analytics on the admin page

Server-only PostHog Query API client with caching, the traffic server action (tiles, series, top blogs, referrers, countries, funnel), and the traffic section on the dashboard with graceful degradation when PostHog is not configured or errors.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Chart foundation (Phase 1)

- Run `npx shadcn@latest add chart` (components.json is already configured, style `base-nova`); confirm it adds `components/ui/chart.tsx` and `recharts` to `package.json`. If the generated file does not compile against React 19 / the installed recharts, fix the types in that file only.
- Load the `dataviz` skill before choosing colors. Replace `--chart-1` .. `--chart-5` in both `:root` and `.dark` of `app/globals.css` with distinguishable hues (keep the existing indigo/violet brand hue 275 as chart-1) with sufficient contrast against `--card` in light and dark.

### 2. Range utilities (Phase 1)

- Create `lib/analytics/range.ts`: `RANGES`, `type Range`, `parseRange(value: string | string[] | undefined): Range` (allowlist 7/30/90, default 30), `getRangeStart(days)` returning the UTC start of day `days - 1` days ago, `getPreviousRangeStart(days)`, `fillDailySeries(rows: {day: Date; [k: string]: ...}[], days, keys)` that returns one point per UTC day with zeros for missing days and `date` as `YYYY-MM-DD`.
- Keep these pure (no `db`/`next` imports) so they are trivially unit-testable later.

### 3. DB analytics server action (Phase 1)

- Create `actions/admin/getDbAnalytics.ts` (`"use server"`), following `getCounts.ts`: `auth()`, `role === "ADMIN"` else `{ error }`, `try/catch` returning `{ error: "Error fetching analytics" }`. Input: `days: Range` (re-validated with `parseRange`, since server actions are callable with arbitrary input).
- Totals (all time): users, verified users, published blogs, drafts.
- Range tiles with previous-period comparison: new users, new published blogs, claps, comments, bookmarks, follows (`count` with `createdAt` windows; run with `Promise.all`).
- Daily series via `db.$queryRaw` using `date_trunc('day', "createdAt")` (UTC) grouped counts for: signups (`"User"`), published blogs (`"Blog"` where `"isPublished"`), claps, comments, bookmarks, follows; pad with `fillDailySeries`. Convert `bigint` counts with `Number(...)`.
- Rankings (all time, top 5): blogs by claps (`orderBy: { claps: { _count: "desc" } }`, published only, with `_count` of claps/comments/bookmarks and author name), authors by followers (`orderBy: { followers: { _count: "desc" } }`), popular tags (`SELECT tag, COUNT(*) FROM "Blog", unnest(tags) AS tag WHERE "isPublished" GROUP BY tag ORDER BY 2 DESC LIMIT 8`).
- Sign-in method split: `db.account.groupBy({ by: ["provider"], _count: true })` plus `db.user.count({ where: { password: { not: null } } })` for email/password accounts.
- Performance: the grouped queries scan only rows inside the range and run in parallel; at this site's size no new indexes are needed (revisit `createdAt` indexes if tables grow into the hundreds of thousands). The page is admin-only and not cached.
- Delete `actions/admin/getCounts.ts` after the dashboard no longer imports it (no leftover code).

### 4. Dashboard building blocks (Phase 1)

- Use the `frontend-design` and `dataviz` skills for these components; match existing Tailwind tokens (`border`, `card`, `muted-foreground`) rather than inventing styles.
- `StatTile.tsx`: big number, label, optional delta (green/red arrow + %, "no change"/"new" when previous is 0), optional hint text.
- `TimeSeriesChart.tsx` (`"use client"`): wraps `components/ui/chart.tsx`; props `title`, `data: {date: string; ...}[]`, `series: {key, label, color}[]`; X axis shows short dates with tick thinning for 90 days; tooltip; `role="img"` + `aria-label` summary; empty-state when all zeros.
- `RankedList.tsx`, `FunnelBars.tsx`: server components with proportional bars; include empty states ("No data yet").
- `RangeToggle.tsx`: three `Link`s to `?range=7|30|90`, active one styled via `buttonVariants`, `aria-current`.
- `SectionSkeleton.tsx`: tile + chart placeholders using `animate-pulse`.

### 5. Rebuild the admin page for Section 1 (Phase 1)

- `app/admin/page.tsx`: accept `searchParams: Promise<{ range?: string }>`, `parseRange`, pass to `AdminDashboard`. Keep the existing admin gate.
- `components/admin/DbAnalyticsSection.tsx`: async server component that calls `getDbAnalytics(range)`, renders the "Site activity" tiles (Users, New users, Published blogs, Claps, Comments, Bookmarks, Follows), the signups / blogs and engagement charts, rankings, sign-in methods, verified ratio, draft ratio; shows `<Alert error ... />` on error.
- `components/admin/AdminDashboard.tsx`: heading, `RangeToggle`, `<Suspense key={range} fallback={<SectionSkeleton />}><DbAnalyticsSection/></Suspense>`. (The traffic section is added in step 15.)

### 6. Phase 1 verification checkpoint

- Run the Validation Commands, then `npm run dev` and check `/admin` as admin in light and dark mode at 7 / 30 / 90 days: tiles match direct DB counts, charts have 7/30/90 points, no console errors or CSP violations, and a non-admin still sees the "Admins only" page.

### 7. Install PostHog SDKs and environment (Phase 2)

- `npm install posthog-js posthog-node server-only`.
- Document (in this plan's Notes and in the PR description) the env vars: `NEXT_PUBLIC_POSTHOG_KEY` (project API key, `phc_...`; inlined at build time, so it must exist in the Render **build** environment), `POSTHOG_PERSONAL_API_KEY` (personal API key scoped to `query:read` only), `POSTHOG_PROJECT_ID`, `POSTHOG_HOST=https://us.posthog.com`. Leave `NEXT_PUBLIC_POSTHOG_KEY` unset locally unless you want dev traffic in PostHog; when unset every tracking helper is a no-op.

### 8. Reverse proxy and middleware exemption (Phase 2)

- `next.config.ts`: add `skipTrailingSlashRedirect: true` and `async rewrites()` returning, in this order: `/ingest/static/:path*` -> `https://us-assets.i.posthog.com/static/:path*`, `/ingest/array/:path*` -> `https://us-assets.i.posthog.com/array/:path*`, `/ingest/:path*` -> `https://us.i.posthog.com/:path*`. Do **not** change the CSP (everything stays same-origin); add a comment next to the `connect-src` directive explaining that PostHog goes through `/ingest`.
- `proxy.ts`: add `ingest` to the negative lookahead of the first matcher entry so unauthenticated visitors' analytics requests are not redirected to `/login`. Verify the `/api` matcher entry does not capture `/ingest`.

### 9. Client tracking (Phase 2)

- Create `lib/analytics/events.ts` with the event-name constants.
- Create `components/analytics/PostHogProvider.tsx` (`"use client"`): `useSession()`; in a `useEffect`, return early if `NEXT_PUBLIC_POSTHOG_KEY` is missing or the user is an `ADMIN` (owner browsing never counts, and no SDK is loaded for admins); otherwise `posthog.init(key, { api_host: "/ingest", ui_host: "https://us.posthog.com", defaults: "2025-05-24" (history-change pageviews for the App Router), persistence: "memory", person_profiles: "identified_only", autocapture: false, disable_session_recording: true, respect_dnt: true })` guarded so it initializes once; call `posthog.identify(session.user.userId)` (id only, never email or name) when logged in. Verify option names against the installed `posthog-js` version's types.
- Mount it in `app/layout.tsx` inside `SessionProvider` (render `null`/children passthrough, no wrapper needed).
- Create `components/analytics/BlogViewTracker.tsx` (`"use client"`): `useEffect` capturing `BLOG_VIEWED` with `{ blog_id }` (no title: titles are joined from the DB later so renames stay correct); render it in `app/blog/(details)/[id]/page.tsx` only for found, accessible blogs.
- Verify in the browser: network tab shows requests only to `/ingest/...`, no cookies and no `ph_*` localStorage keys are written, and the console shows no CSP violations (posthog-js must not need `unsafe-eval`; if it does, stop and ask before loosening the CSP).

### 10. Server-side funnel events (Phase 2)

- Create `lib/analytics/posthogServer.ts`: lazily constructed `PostHog` (`posthog-node`) with `host: "https://us.i.posthog.com"`, `flushAt: 1`, `flushInterval: 0`; `trackServerEvent(distinctId, event, properties)` is synchronous from the caller's perspective, wraps in try/catch, logs failures with `console.error`, and no-ops without `NEXT_PUBLIC_POSTHOG_KEY`. Properties must never contain email, name or other PII.
- `actions/auth/register.ts`: capture the created user (`const created = await db.user.create(...)`) and call `trackServerEvent(created.id, USER_SIGNED_UP, { method: "credentials" })` only in the new-account branch.
- `actions/auth/email-verification.ts`: call `trackServerEvent(existingUser.id, EMAIL_VERIFIED, { method: "email" })` after the sign-up verification `db.user.update` (not in the change-email branch).
- `auth.ts` `events`: add `createUser({ user })` -> `USER_SIGNED_UP` `{ method: "oauth" }`; extend `linkAccount({ user, account })` -> `EMAIL_VERIFIED` `{ method: account.provider }` after the existing update.
- `actions/blogs/create-blog.ts`: when `isPublished`, track `BLOG_PUBLISHED` after the create succeeds. `actions/blogs/edit-blog.ts`: track `BLOG_PUBLISHED` only when the blog transitions from unpublished to published.
- Server events must never delay or fail the action: errors are swallowed inside the helper.

### 11. Privacy Policy update (Phase 2)

- `lib/siteInfo.ts`: set `LEGAL_LAST_UPDATED` to the implementation date and add `ANALYTICS_RETENTION` (confirm the real value in PostHog > Project settings / billing plan before writing it; free-plan retention is typically one year).
- `app/privacy/page.tsx`:
  - Section 2: replace "We don't use advertising or analytics trackers" with an accurate description: we use PostHog to count visits and see which pages and posts are viewed; data collected = pages viewed, referring site, approximate country, browser/device type, and (for logged-in users) a random account ID with no name or email; not collected for site administrators; Do Not Track is honored; no advertising profiles.
  - Section 4: add analytics to legitimate interests (Art. 6(1)(f)): understanding usage and improving the site.
  - Section 5: add **PostHog** (analytics, US-hosted) to the provider list.
  - Section 6: keep "no banner" only if still true; state that PostHog runs without cookies or local storage and add nothing to the cookie table; fix the sentence "We don't use ... analytics ... cookies" so it stays accurate.
  - Section 7: add analytics retention (`ANALYTICS_RETENTION`) and explain that after account deletion the random ID can no longer be linked to the person.
  - Section 8: mention how to opt out (Do Not Track) and that analytics data can be deleted on request by emailing the contact address.
  - Section 9: add PostHog to the US-processing statement.
- Check `app/terms/page.tsx` for statements that conflict (none found by search, re-check after edits).

### 12. Phase 2 verification checkpoint

- Run the Validation Commands. With a real `NEXT_PUBLIC_POSTHOG_KEY` locally: visit pages logged out and as a normal user, publish a test blog, sign up a test account, and confirm `$pageview`, `blog_viewed`, `user_signed_up`, `email_verified` and `blog_published` appear in PostHog Live events; confirm an admin session sends nothing.

### 13. PostHog query client (Phase 3)

- Create `lib/analytics/posthogQuery.ts` (server-only: `import "server-only"` at the top (package installed in step 7), so the personal API key can never be bundled into client code; the same applies to `lib/analytics/posthogServer.ts`): `runHogQL<T>(query: string)` posting `{ query: { kind: "HogQLQuery", query }, name: "admin-dashboard" }` to `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/` with `Authorization: Bearer ${POSTHOG_PERSONAL_API_KEY}`, an `AbortSignal.timeout(10_000)`, and a `globalThis` TTL cache (5 minutes, keyed by query string, bounded size) mirroring `lib/rateLimit.ts`. Throw a typed error when env vars are missing so the UI can show "PostHog is not configured".
- Add `runFunnel(steps, days)` posting a `FunnelsQuery` (`series` of `EventsNode`s, `dateRange.date_from: "-${days}d"`, 30-day conversion window). Verify the response shape against the live API during implementation; if it differs, fall back to `count(DISTINCT distinct_id)` per event via HogQL and document the non-strict ordering.
- Query strings contain only constants and the allowlisted integer `days`; never interpolate request input.

### 14. Traffic analytics server action (Phase 3)

- Create `actions/admin/getTrafficAnalytics.ts` (`"use server"`, same admin check and `{ error } | { success }` shape; accepts `days: Range`). Run in parallel:
  - Totals with previous-period comparison: pageviews, visitors (`count(DISTINCT person_id)`), blog views, over `2 * days` with `countIf`.
  - Daily series: `toStartOfDay(timestamp)` grouped `countIf($pageview)`, `count(DISTINCT person_id)`, `countIf(blog_viewed)`, padded with `fillDailySeries`.
  - Top blogs: `properties.blog_id` for `blog_viewed`, limit 10, then one `db.blog.findMany({ where: { id: { in: ids }, isPublished: true }, select: { id, title } })` to attach titles (drop ids that no longer exist).
  - Top referrers: distinct visitors by `properties.$referring_domain`, excluding the site's own host from `SITE_URL` and mapping `$direct` to "Direct".
  - Top countries: distinct visitors by `properties.$geoip_country_name` (hide the card if everything is empty).
  - Funnel: `USER_SIGNED_UP` -> `EMAIL_VERIFIED` -> `BLOG_PUBLISHED`.

### 15. Traffic section UI (Phase 3)

- Create `components/admin/TrafficAnalyticsSection.tsx` (async server component): tiles (Visitors, Pageviews, Blog views), visitors/pageviews and blog-views charts, top blogs (links to `/blog/<id>`), referrers, countries, `FunnelBars`. A short hint explains that cookieless tracking counts a returning visitor again on a new visit, so "Visitors" is approximate. Error states: missing configuration -> informational `Alert`; API failure -> error `Alert`; neither affects the database section.
- Add it to `AdminDashboard.tsx` as a second `<Suspense key={range} fallback={<SectionSkeleton />}>` below the database section, with a section heading for each.

### 16. Cleanup

- Confirm nothing imports `getCounts` and that the file is deleted; remove any unused helper or import introduced while iterating.

### 17. Final validation

- Run every command in `Validation Commands`, then do the manual checklist from the Testing Strategy in light and dark mode, desktop and phone width.

## Testing Strategy

The repo has no test runner (no `test` script, no Jest/Vitest). This plan does not add one; correctness is covered by type-checking, linting, a production build, and the manual checks below. The analytics helpers are written as pure functions (`lib/analytics/range.ts`, row mapping in the actions) so tests can be added later without refactoring (see Notes).

### Unit Tests

Not applicable without a runner. Pure functions to cover if one is added: `parseRange` (valid, invalid, array, undefined), `fillDailySeries` (gaps, empty input, DST-irrelevant UTC days), delta calculation (previous = 0), HogQL result-row mapping.

### Integration Tests

Manual, with seeded data in a dev database:

- `/admin` as ADMIN shows tiles and charts; as USER shows "Admins only"; logged out is redirected to `/login` by the middleware.
- Tile totals equal counts from the Neon console for each range; the sum of the daily series equals the tile value.
- Range toggle changes the URL, both sections reload (Suspense fallback visible), and an invalid `?range=abc` falls back to 30.
- With PostHog env vars set: events from a normal browser appear in PostHog Live events, the traffic section matches PostHog's own UI within the cache window, and the funnel counts steps for a test signup -> verify -> publish.
- Without PostHog env vars: DB section renders, traffic section shows the "not configured" message, and no network calls go to `/ingest`.
- With the PostHog API failing (bad key): traffic section shows an error while the DB section is unaffected.
- CSP: browser console has no "Refused to load ..." errors on `/`, a blog page, and `/admin`.
- Privacy: DevTools > Application shows no new cookies or `ph_*` localStorage entries; `/ingest/...` requests succeed for logged-out visitors (not redirected to `/login`).

### Edge Cases

- Day with zero activity (series must still contain the day).
- Brand new site / empty tables / PostHog with zero events (empty states, no divide-by-zero in deltas and funnel percentages).
- Previous-period value of 0 (delta shows "new", not Infinity).
- Draft blogs never counted as published or shown in rankings; a blog deleted after being viewed disappears from "top blogs" instead of showing a blank title.
- Blog viewed by an admin or by a bot/crawler (not tracked / filtered by PostHog).
- Visitor with Do Not Track enabled sends nothing.
- OAuth sign-up fires both `user_signed_up` and `email_verified`; credentials sign-up fires them at different times; change-email confirmation fires neither.
- Editing a published blog does not re-fire `blog_published`; publishing a draft does.
- `NEXT_PUBLIC_POSTHOG_KEY` missing at build time (no-op everywhere, no crash).
- Concurrent `posthog.init` calls (React StrictMode double-effect in dev) initialize once.
- 90-day chart on a narrow phone screen (tick thinning, no horizontal page scroll).

## Acceptance Criteria

- `/admin` is restricted to admins exactly as before, and `?range=7|30|90` (default 30) controls every tile and chart on the page; an invalid value falls back to 30.
- The "Site activity" section shows: users, new users, published blogs, claps, comments, bookmarks, follows (each with change vs previous period where meaningful), daily charts for signups, published blogs and engagement, top 5 blogs, top 5 authors, popular tags, sign-in method split, and verified and draft ratios, with numbers matching the database.
- The "Traffic" section shows visitors, pageviews and blog views with change vs previous period, a visitors/pageviews chart, a blog views chart, top blogs by views, top referrers, top countries (when available) and the signup -> verified -> published funnel with step conversion rates.
- A PostHog outage or missing configuration degrades only the traffic section.
- All PostHog browser traffic goes through `/ingest`; the CSP header is unchanged; unauthenticated `/ingest` requests are not redirected; no cookies or localStorage entries are created by tracking; admin sessions and Do Not Track visitors send no events.
- Server events contain only the random user id and non-PII properties (no email, name, or content).
- The Privacy Policy accurately describes PostHog (what, why, legal basis, provider, US transfer, retention, opt-out, deletion) and `LEGAL_LAST_UPDATED` is updated; no sentence in the policy still says analytics are not used.
- `getCounts.ts` is removed; `npx tsc --noEmit`, scoped ESLint, and `npm run build` pass with no new warnings.

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

- **Cookieless trade-off:** with in-memory persistence a returning visitor is counted again after a full page reload, so "Visitors" is approximate. Pageviews and per-blog views are accurate. Logged-in users are identified by user id and are counted once. Switching to cookies would need a consent banner and a policy rewrite.
- **Funnel starts at sign-up:** anonymous visitors cannot be linked to their later sign-up while cookieless, so "visited the site" is not a funnel step; the funnel measures sign-up -> verified -> published. Events exist only from the day Phase 2 is deployed (existing users are not in PostHog).
- **Admin is excluded** from client tracking so your own browsing does not inflate numbers. That also means you must test tracking with a non-admin account (or an incognito window while logged out). Server-side `blog_published` events from an admin account are still sent.
- **Manual PostHog setup (one-time):** create a PostHog Cloud **US** project; copy the project API key; create a personal API key with only `query:read`; note the project id; set the four env vars in Render (the `NEXT_PUBLIC_` one before the build); set the project timezone to UTC so PostHog days line up with database days; enable "Discard client IP data" if you do not want IPs stored (check that country data still works) and set the data-retention period to match `ANALYTICS_RETENTION`.
- **Account deletion:** the policy says events cannot be linked to a person after deletion (the random id is removed from the database). If you want hard deletion, a follow-up can call PostHog's person-delete API from `actions/users/delete-user.ts` (needs an extra `person:write` scope on the key).
- **Privacy Policy promises a "clearer announcement" for significant changes:** adding analytics counts. Consider a one-time notice (e.g. a line in the footer or a short post) when this ships.
- **Published-blogs chart uses `Blog.createdAt`**, so a draft published later counts on the day it was created. Adding a `publishedAt` column would fix that (schema change, deliberately out of scope).
- **Possible later additions:** vitest for the pure helpers, a "most engaged blogs in range" ranking (needs windowed SQL), CSV export, and PostHog session replay (would need the CSP and consent re-evaluated).
- **Verify against current docs during implementation:** `posthog-js` init options (`defaults`, `person_profiles`, `respect_dnt`), the Query API request/response shape (HogQL and `FunnelsQuery`), and the rewrite list for the `/ingest` proxy.

**For UI features:** Use the `frontend-design` skill during `/implement` for high-quality, distinctive interfaces.
