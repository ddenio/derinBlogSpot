import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

const EMPTY_SIDEBAR = {
  tags: [] as { tag: string; count: number }[],
  topPosts: [] as { id: string; title: string; _count: { claps: number } }[],
};

// Data for the feed's side column: the most used tags and the most clapped
// posts. Public information only (published posts), so no auth is needed.
// It changes slowly and the queries scan every post, so it is cached for five
// minutes instead of being recomputed on every page view and search keystroke.
// This function throws on a database error: a thrown error is never cached.
const loadSidebar = async () => {
  const [tags, topPosts] = await Promise.all([
    db.$queryRaw<{ tag: string; count: number }[]>`
        SELECT tag, COUNT(*)::int AS count
          FROM "Blog", unnest("tags") AS tag
         WHERE "isPublished"
         GROUP BY tag
         ORDER BY count DESC, tag
         LIMIT 10
      `,
    db.blog.findMany({
      where: { isPublished: true },
      orderBy: [{ claps: { _count: "desc" } }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        _count: { select: { claps: true } },
      },
    }),
  ]);

  return {
    tags: tags.map((row) => ({ tag: row.tag, count: Number(row.count) })),
    topPosts,
  };
};

const cachedSidebar = unstable_cache(loadSidebar, ["feed-sidebar"], {
  revalidate: 300,
});

export const getFeedSidebar = async () => {
  try {
    return await cachedSidebar();
  } catch (error) {
    // The side column is a nice-to-have: never let it break the feed
    console.error("Failed to load the feed sidebar:", error);

    return EMPTY_SIDEBAR;
  }
};
