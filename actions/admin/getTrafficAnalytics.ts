"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  BLOG_PUBLISHED,
  BLOG_VIEWED,
  EMAIL_VERIFIED,
  USER_SIGNED_UP,
} from "@/lib/analytics/events";
import {
  PostHogNotConfiguredError,
  PostHogQueryError,
  hogqlString,
  hogqlTimestamp,
  runHogQL,
  toNumber,
} from "@/lib/analytics/posthogQuery";
import {
  type DailyPoint,
  fillDailySeries,
  getPreviousRangeStart,
  getRangeStart,
  parseRange,
} from "@/lib/analytics/range";
import type { RankedItem } from "@/lib/analytics/types";
import { SITE_URL } from "@/lib/siteInfo";
import type { RangeTotal } from "./getDbAnalytics";

const SERIES_KEYS = ["pageviews", "visitors", "blogViews"] as const;

export type FunnelStep = { label: string; count: number };

export type TrafficAnalytics = {
  totals: Record<(typeof SERIES_KEYS)[number], RangeTotal>;
  series: DailyPoint<(typeof SERIES_KEYS)[number]>[];
  topBlogs: RankedItem[];
  referrers: RankedItem[];
  countries: RankedItem[];
  funnel: FunnelStep[];
};

export type TrafficResult =
  | { success: TrafficAnalytics; error?: undefined; notConfigured?: undefined }
  | { error: string; notConfigured?: boolean; success?: undefined };

// Server-side events have no $host; they are tagged with the environment
// instead (see lib/analytics/posthogServer.ts)
const IS_PRODUCTION_SERVER_EVENT = `properties.environment = 'production'`;

const BROWSER_EVENTS = `('$pageview', ${hogqlString(BLOG_VIEWED)})`;

const FUNNEL_LABELS = ["Signed up", "Verified email", "Published a blog"];

const MAX_LABEL_LENGTH = 80;

const truncate = (text: string) =>
  text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH)}…` : text;

export const getTrafficAnalytics = async (
  days: unknown,
): Promise<TrafficResult> => {
  const session = await auth();

  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin) return { error: "Error fetching traffic analytics" };

  // Server actions can be called with anything, so never trust the input
  const range = parseRange(days);

  try {
    // One `now` so every window below lines up with the database section
    const now = new Date();
    const start = hogqlTimestamp(getRangeStart(range, now));
    const previousStart = hogqlTimestamp(getPreviousRangeStart(range, now));

    // Only events from the real site count: PostHog is shared with local
    // development, which also sends events (from localhost).
    const siteHost = new URL(SITE_URL).host;
    const IS_SITE = `properties.$host = ${hogqlString(siteHost)}`;

    // Everything interpolated below is a constant, a date we computed, or the
    // allowlisted range: no request input ever reaches a query string.
    const queries = {
      totals: `
      SELECT
        countIf(event = '$pageview' AND timestamp >= ${start}),
        countIf(event = '$pageview' AND timestamp < ${start}),
        count(DISTINCT if(event = '$pageview' AND timestamp >= ${start}, person_id, NULL)),
        count(DISTINCT if(event = '$pageview' AND timestamp < ${start}, person_id, NULL)),
        countIf(event = ${hogqlString(BLOG_VIEWED)} AND timestamp >= ${start}),
        countIf(event = ${hogqlString(BLOG_VIEWED)} AND timestamp < ${start})
      FROM events
      WHERE event IN ${BROWSER_EVENTS}
        AND timestamp >= ${previousStart}
        AND ${IS_SITE}`,
      daily: `
      SELECT
        toString(toDate(toTimeZone(timestamp, 'UTC'))) AS day,
        countIf(event = '$pageview'),
        count(DISTINCT if(event = '$pageview', person_id, NULL)),
        countIf(event = ${hogqlString(BLOG_VIEWED)})
      FROM events
      WHERE event IN ${BROWSER_EVENTS}
        AND timestamp >= ${start}
        AND ${IS_SITE}
      GROUP BY day
      ORDER BY day
      LIMIT 400`,
      topBlogs: `
      SELECT properties.blog_id AS blog_id, count() AS views, count(DISTINCT person_id) AS visitors
      FROM events
      WHERE event = ${hogqlString(BLOG_VIEWED)}
        AND timestamp >= ${start}
        AND ${IS_SITE}
        AND isNotNull(properties.blog_id)
      GROUP BY blog_id
      ORDER BY views DESC
      LIMIT 20`,
      referrers: `
      SELECT properties.$referring_domain AS referrer, count(DISTINCT person_id) AS visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= ${start}
        AND ${IS_SITE}
        AND isNotNull(properties.$referring_domain)
        AND properties.$referring_domain NOT IN (${hogqlString(siteHost)}, ${hogqlString(`www.${siteHost}`)})
      GROUP BY referrer
      ORDER BY visitors DESC
      LIMIT 8`,
      countries: `
      SELECT properties.$geoip_country_name AS country, count(DISTINCT person_id) AS visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= ${start}
        AND ${IS_SITE}
        AND isNotNull(properties.$geoip_country_name)
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 8`,
      // Per person: the first time they did each step, then count the people
      // who did the steps in order
      funnel: `
      SELECT
        countIf(isNotNull(signed_up_at)),
        countIf(isNotNull(signed_up_at) AND verified_at >= signed_up_at),
        countIf(isNotNull(signed_up_at) AND verified_at >= signed_up_at AND published_at >= verified_at)
      FROM (
        SELECT
          person_id,
          min(if(event = ${hogqlString(USER_SIGNED_UP)}, timestamp, NULL)) AS signed_up_at,
          min(if(event = ${hogqlString(EMAIL_VERIFIED)}, timestamp, NULL)) AS verified_at,
          min(if(event = ${hogqlString(BLOG_PUBLISHED)}, timestamp, NULL)) AS published_at
        FROM events
        WHERE event IN (${hogqlString(USER_SIGNED_UP)}, ${hogqlString(EMAIL_VERIFIED)}, ${hogqlString(BLOG_PUBLISHED)})
          AND timestamp >= ${start}
          AND ${IS_PRODUCTION_SERVER_EVENT}
        GROUP BY person_id
      )`,
    };

    // PostHog runs at most 3 queries at once per project, so go in two waves
    const [totals, daily, topBlogs] = await Promise.all([
      runHogQL(queries.totals),
      runHogQL(queries.daily),
      runHogQL(queries.topBlogs),
    ]);
    const [referrers, countries, funnel] = await Promise.all([
      runHogQL(queries.referrers),
      runHogQL(queries.countries),
      runHogQL(queries.funnel),
    ]);

    const [
      pageviews = 0,
      pageviewsBefore = 0,
      visitors = 0,
      visitorsBefore = 0,
      blogViews = 0,
      blogViewsBefore = 0,
    ] = (totals[0] ?? []).map(toNumber);

    const blogIds = topBlogs.map((row) => String(row[0]));

    // Titles come from the database so renamed blogs show their current name
    // and deleted or unpublished ones drop out
    const titles = blogIds.length
      ? await db.blog.findMany({
          where: { id: { in: blogIds }, isPublished: true },
          select: { id: true, title: true },
        })
      : [];

    const titleById = new Map(titles.map((blog) => [blog.id, blog.title]));

    const funnelCounts = (funnel[0] ?? []).map(toNumber);

    const analytics: TrafficAnalytics = {
      totals: {
        pageviews: { current: pageviews, previous: pageviewsBefore },
        visitors: { current: visitors, previous: visitorsBefore },
        blogViews: { current: blogViews, previous: blogViewsBefore },
      },
      series: fillDailySeries(
        daily.map((row) => ({
          day: new Date(`${String(row[0])}T00:00:00.000Z`),
          pageviews: toNumber(row[1]),
          visitors: toNumber(row[2]),
          blogViews: toNumber(row[3]),
        })),
        range,
        SERIES_KEYS,
        now,
      ),
      topBlogs: topBlogs
        .filter((row) => titleById.has(String(row[0])))
        .map((row) => ({
          id: String(row[0]),
          label: titleById.get(String(row[0])) ?? "",
          value: toNumber(row[1]),
          hint: `${toNumber(row[2])} ${toNumber(row[2]) === 1 ? "visitor" : "visitors"}`,
          href: `/blog/${String(row[0])}`,
        }))
        .slice(0, 5),
      // Anyone can send events with the public project key, so these labels
      // are untrusted text: cap their length
      referrers: referrers.map((row) => ({
        id: String(row[0]),
        label: row[0] === "$direct" ? "Direct" : truncate(String(row[0])),
        value: toNumber(row[1]),
      })),
      countries: countries.map((row) => ({
        id: String(row[0]),
        label: truncate(String(row[0])),
        value: toNumber(row[1]),
      })),
      funnel: FUNNEL_LABELS.map((label, index) => ({
        label,
        count: funnelCounts[index] ?? 0,
      })),
    };

    return { success: analytics };
  } catch (error) {
    if (error instanceof PostHogNotConfiguredError)
      return { error: "PostHog is not configured.", notConfigured: true };

    if (error instanceof PostHogQueryError) {
      console.error("PostHog query failed:", error.message, error.detail);

      if (error.status === 429)
        return {
          error:
            "PostHog's rate limit was reached. Try again in a few minutes.",
        };
    } else {
      console.error("Failed to load PostHog analytics:", error);
    }

    return { error: "Error fetching traffic analytics" };
  }
};
