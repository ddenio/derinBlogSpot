# Feature: Part 2 of 3: Admin Analytics Dashboard - PostHog collection, reverse proxy and privacy policy

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

Part 1 (`2026-10-22-admin-analytics-dashboard-part-1-database-analytics.md`). Branch from, or wait for the merge of, Part 1. This part does not touch the dashboard UI, so it can also ship independently; it just starts collecting data.

## Relevant Files

Use these files to implement this part:

- `next.config.ts` - add `rewrites()` for `/ingest` and `skipTrailingSlashRedirect`; the CSP stays unchanged because the proxy keeps traffic same-origin.
- `proxy.ts` - the Next 16 middleware; its matcher must exclude `ingest` or logged-out visitors' analytics requests are redirected to `/login`.
- `app/layout.tsx` - mount `PostHogProvider` inside `SessionProvider`.
- `app/blog/(details)/[id]/page.tsx` - add `BlogViewTracker`.
- `actions/auth/register.ts` - `user_signed_up` (credentials, new-account branch only).
- `actions/auth/email-verification.ts` - `email_verified` on the sign-up branch only.
- `auth.ts` - `events.createUser` (OAuth sign-up) and extend `events.linkAccount`.
- `actions/blogs/create-blog.ts`, `actions/blogs/edit-blog.ts` - `blog_published`.
- `app/privacy/page.tsx`, `lib/siteInfo.ts` - policy sections 2, 4, 5, 6, 7, 8, 9, `LEGAL_LAST_UPDATED`, new `ANALYTICS_RETENTION`.
- `app/terms/page.tsx` - re-check for conflicting statements.
- `lib/rateLimit.ts` - reference pattern for module state on `globalThis`.
- `package.json` - `posthog-js`, `posthog-node`, `server-only`.

### New Files

- `lib/analytics/events.ts`
- `lib/analytics/posthogServer.ts`
- `components/analytics/PostHogProvider.tsx`
- `components/analytics/BlogViewTracker.tsx`

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Install PostHog SDKs and environment

- `npm install posthog-js posthog-node server-only`.
- Document (in this plan's Notes and in the PR description) the env vars: `NEXT_PUBLIC_POSTHOG_KEY` (project API key, `phc_...`; inlined at build time, so it must exist in the Render **build** environment), `POSTHOG_PERSONAL_API_KEY` (personal API key scoped to `query:read` only), `POSTHOG_PROJECT_ID`, `POSTHOG_HOST=https://us.posthog.com`. Leave `NEXT_PUBLIC_POSTHOG_KEY` unset locally unless you want dev traffic in PostHog; when unset every tracking helper is a no-op.

### 2. Reverse proxy and middleware exemption

- `next.config.ts`: add `skipTrailingSlashRedirect: true` and `async rewrites()` returning, in this order: `/ingest/static/:path*` -> `https://us-assets.i.posthog.com/static/:path*`, `/ingest/array/:path*` -> `https://us-assets.i.posthog.com/array/:path*`, `/ingest/:path*` -> `https://us.i.posthog.com/:path*`. Do **not** change the CSP (everything stays same-origin); add a comment next to the `connect-src` directive explaining that PostHog goes through `/ingest`.
- `proxy.ts`: add `ingest` to the negative lookahead of the first matcher entry so unauthenticated visitors' analytics requests are not redirected to `/login`. Verify the `/api` matcher entry does not capture `/ingest`.

### 3. Client tracking

- Create `lib/analytics/events.ts` with the event-name constants.
- Create `components/analytics/PostHogProvider.tsx` (`"use client"`): `useSession()`; in a `useEffect`, return early if `NEXT_PUBLIC_POSTHOG_KEY` is missing or the user is an `ADMIN` (owner browsing never counts, and no SDK is loaded for admins); otherwise `posthog.init(key, { api_host: "/ingest", ui_host: "https://us.posthog.com", defaults: "2025-05-24" (history-change pageviews for the App Router), persistence: "memory", person_profiles: "identified_only", autocapture: false, disable_session_recording: true, respect_dnt: true })` guarded so it initializes once; call `posthog.identify(session.user.userId)` (id only, never email or name) when logged in. Verify option names against the installed `posthog-js` version's types.
- Mount it in `app/layout.tsx` inside `SessionProvider` (render `null`/children passthrough, no wrapper needed).
- Create `components/analytics/BlogViewTracker.tsx` (`"use client"`): `useEffect` capturing `BLOG_VIEWED` with `{ blog_id }` (no title: titles are joined from the DB later so renames stay correct); render it in `app/blog/(details)/[id]/page.tsx` only for found, accessible blogs.
- Verify in the browser: network tab shows requests only to `/ingest/...`, no cookies and no `ph_*` localStorage keys are written, and the console shows no CSP violations (posthog-js must not need `unsafe-eval`; if it does, stop and ask before loosening the CSP).

### 4. Server-side funnel events

- Create `lib/analytics/posthogServer.ts`: lazily constructed `PostHog` (`posthog-node`) with `host: "https://us.i.posthog.com"`, `flushAt: 1`, `flushInterval: 0`; `trackServerEvent(distinctId, event, properties)` is synchronous from the caller's perspective, wraps in try/catch, logs failures with `console.error`, and no-ops without `NEXT_PUBLIC_POSTHOG_KEY`. Properties must never contain email, name or other PII.
- `actions/auth/register.ts`: capture the created user (`const created = await db.user.create(...)`) and call `trackServerEvent(created.id, USER_SIGNED_UP, { method: "credentials" })` only in the new-account branch.
- `actions/auth/email-verification.ts`: call `trackServerEvent(existingUser.id, EMAIL_VERIFIED, { method: "email" })` after the sign-up verification `db.user.update` (not in the change-email branch).
- `auth.ts` `events`: add `createUser({ user })` -> `USER_SIGNED_UP` `{ method: "oauth" }`; extend `linkAccount({ user, account })` -> `EMAIL_VERIFIED` `{ method: account.provider }` after the existing update.
- `actions/blogs/create-blog.ts`: when `isPublished`, track `BLOG_PUBLISHED` after the create succeeds. `actions/blogs/edit-blog.ts`: track `BLOG_PUBLISHED` only when the blog transitions from unpublished to published.
- Server events must never delay or fail the action: errors are swallowed inside the helper.

### 5. Privacy Policy update

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

### 6. Phase 2 verification checkpoint

- Run the Validation Commands. With a real `NEXT_PUBLIC_POSTHOG_KEY` locally: visit pages logged out and as a normal user, publish a test blog, sign up a test account, and confirm `$pageview`, `blog_viewed`, `user_signed_up`, `email_verified` and `blog_published` appear in PostHog Live events; confirm an admin session sends nothing.

## Testing Strategy

Manual, with a real `NEXT_PUBLIC_POSTHOG_KEY` locally: browse logged out and as a normal user; sign up a test credentials account and an OAuth account; verify email; publish a draft and edit a published blog; confirm each event in PostHog Live events. Check DevTools > Application for cookies/localStorage, the Network tab for `/ingest/...` only, and the console for CSP violations. Edge cases: StrictMode double effect initializes once, key missing at build time, DNT enabled, admin session.

## Acceptance Criteria

- All PostHog browser traffic goes through `/ingest`; the CSP header is unchanged; logged-out `/ingest` requests are not redirected.
- No cookies or `ph_*` localStorage entries are created; admin sessions and Do Not Track visitors send no events; no CSP violations in the console.
- `$pageview`, `blog_viewed`, `user_signed_up`, `email_verified` and `blog_published` appear in PostHog Live events for a normal user; editing an already-published blog does not re-fire `blog_published`; the change-email confirmation fires nothing.
- Server events carry only the random user id and non-PII properties and never delay or fail the action.
- With `NEXT_PUBLIC_POSTHOG_KEY` unset everything is a no-op and the build passes.
- The Privacy Policy accurately describes PostHog (what, why, legal basis, provider, US transfer, retention, opt-out, deletion); no sentence still says analytics are not used; `LEGAL_LAST_UPDATED` is updated.
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
