"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  type DailyPoint,
  fillDailySeries,
  getPreviousRangeStart,
  getRangeStart,
  parseRange,
} from "@/lib/analytics/range";
import type { RankedItem } from "@/lib/analytics/types";

const SERIES_KEYS = [
  "signups",
  "blogs",
  "claps",
  "comments",
  "bookmarks",
  "follows",
] as const;

type SeriesKey = (typeof SERIES_KEYS)[number];

// `day` is a UTC calendar day as YYYY-MM-DD (formatted in SQL so no driver or
// server time zone can shift it)
type RawRow = { kind: SeriesKey; day: string; count: number };

export type RangeTotal = { current: number; previous: number };

export type DbAnalytics = {
  totals: {
    users: number;
    verifiedUsers: number;
    publishedBlogs: number;
    draftBlogs: number;
  };
  // Totals for the range and for the equally long period before it
  range: Record<SeriesKey, RangeTotal>;
  series: DailyPoint<SeriesKey>[];
  topBlogs: RankedItem[];
  topAuthors: RankedItem[];
  topTags: RankedItem[];
  signInMethods: RankedItem[];
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

export const getDbAnalytics = async (days: unknown) => {
  const session = await auth();

  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin) return { error: "Error fetching analytics" };

  // Server actions can be called with anything, so never trust the input
  const range = parseRange(days);

  // One `now` for every helper, so a UTC midnight passing while the queries
  // run can't make the chart window differ from the totals window
  const now = new Date();
  const start = getRangeStart(range, now);
  const previousStart = getPreviousRangeStart(range, now);

  try {
    const [
      rows,
      users,
      verifiedUsers,
      publishedBlogs,
      draftBlogs,
      blogs,
      authors,
      tags,
      accounts,
      passwordUsers,
    ] = await Promise.all([
      // One round trip for every daily series, covering the range plus the
      // previous period.
      db.$queryRaw<RawRow[]>`
        SELECT 'signups'::text AS kind, to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
          FROM "User" WHERE "createdAt" >= ${previousStart} GROUP BY 2
        UNION ALL
        SELECT 'blogs'::text, to_char("createdAt", 'YYYY-MM-DD'), COUNT(*)::int
          FROM "Blog" WHERE "isPublished" AND "createdAt" >= ${previousStart} GROUP BY 2
        UNION ALL
        SELECT 'claps'::text, to_char("createdAt", 'YYYY-MM-DD'), COUNT(*)::int
          FROM "Clap" WHERE "createdAt" >= ${previousStart} GROUP BY 2
        UNION ALL
        SELECT 'comments'::text, to_char("createdAt", 'YYYY-MM-DD'), COUNT(*)::int
          FROM "Comment" WHERE "createdAt" >= ${previousStart} GROUP BY 2
        UNION ALL
        SELECT 'bookmarks'::text, to_char("createdAt", 'YYYY-MM-DD'), COUNT(*)::int
          FROM "Bookmark" WHERE "createdAt" >= ${previousStart} GROUP BY 2
        UNION ALL
        SELECT 'follows'::text, to_char("createdAt", 'YYYY-MM-DD'), COUNT(*)::int
          FROM "Follow" WHERE "createdAt" >= ${previousStart} GROUP BY 2
      `,
      db.user.count(),
      db.user.count({ where: { emailVerified: { not: null } } }),
      db.blog.count({ where: { isPublished: true } }),
      db.blog.count({ where: { isPublished: false } }),
      db.blog.findMany({
        where: { isPublished: true },
        orderBy: [{ claps: { _count: "desc" } }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          user: { select: { name: true } },
          _count: { select: { claps: true, comments: true, bookmarks: true } },
        },
      }),
      db.user.findMany({
        where: { followers: { some: {} } },
        orderBy: [{ followers: { _count: "desc" } }, { createdAt: "asc" }],
        take: 5,
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              followers: true,
              blogs: { where: { isPublished: true } },
            },
          },
        },
      }),
      db.$queryRaw<{ tag: string; count: number }[]>`
        SELECT tag, COUNT(*)::int AS count
          FROM "Blog", unnest("tags") AS tag
         WHERE "isPublished"
         GROUP BY tag
         ORDER BY count DESC, tag
         LIMIT 8
      `,
      db.account.groupBy({ by: ["provider"], _count: { _all: true } }),
      db.user.count({ where: { password: { not: null } } }),
    ]);

    const parsedRows = rows.map((row) => ({
      kind: row.kind,
      day: new Date(`${row.day}T00:00:00.000Z`),
      count: Number(row.count),
    }));

    const rangeTotals = Object.fromEntries(
      SERIES_KEYS.map((key) => [key, { current: 0, previous: 0 }]),
    ) as Record<SeriesKey, RangeTotal>;

    parsedRows.forEach((row) => {
      if (row.day >= start) rangeTotals[row.kind].current += row.count;
      else rangeTotals[row.kind].previous += row.count;
    });

    const byDay = new Map<string, { day: Date } & Partial<Record<SeriesKey, number>>>();

    parsedRows
      .filter((row) => row.day >= start)
      .forEach((row) => {
        const key = row.day.toISOString().slice(0, 10);
        const entry = byDay.get(key) ?? { day: row.day };

        entry[row.kind] = row.count;
        byDay.set(key, entry);
      });

    const signInMethods: RankedItem[] = [
      ...(passwordUsers
        ? [{ id: "credentials", label: "Email & password", value: passwordUsers }]
        : []),
      ...accounts.map((account) => ({
        id: account.provider,
        label: PROVIDER_LABELS[account.provider] ?? account.provider,
        value: account._count._all,
      })),
    ].sort((a, b) => b.value - a.value);

    const analytics: DbAnalytics = {
      totals: { users, verifiedUsers, publishedBlogs, draftBlogs },
      range: rangeTotals,
      series: fillDailySeries([...byDay.values()], range, SERIES_KEYS, now),
      topBlogs: blogs
        .filter((blog) => blog._count.claps > 0)
        .map((blog) => ({
          id: blog.id,
          label: blog.title,
          value: blog._count.claps,
          hint: `${blog.user?.name ?? "Unknown"} · ${blog._count.comments} comments · ${blog._count.bookmarks} bookmarks`,
          href: `/blog/${blog.id}`,
        })),
      topAuthors: authors
        .filter((author) => author._count.followers > 0)
        .map((author) => ({
          id: author.id,
          label: author.name ?? "Unnamed user",
          value: author._count.followers,
          hint: `${author._count.blogs} published ${author._count.blogs === 1 ? "post" : "posts"}`,
          href: `/user/${author.id}/1`,
        })),
      topTags: tags.map((tag) => ({
        id: tag.tag,
        label: tag.tag,
        value: Number(tag.count),
      })),
      signInMethods,
    };

    return { success: analytics };
  } catch (error) {
    console.error("Failed to load admin analytics:", error);

    return { error: "Error fetching analytics" };
  }
};
