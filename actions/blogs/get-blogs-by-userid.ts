"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

interface GetPublishedBlogsParams {
  page: number;
  limit: number;
  userId: string;
}

export const getBlogsByUserId = async ({
  page = 1,
  limit = 5,
  userId,
}: GetPublishedBlogsParams) => {
  const skip = (page - 1) * limit;

  const session = await auth();
  const viewerId = session?.user.userId;

  // Drafts are only visible to their author
  const where = {
    userId,
    ...(viewerId === userId ? {} : { isPublished: true }),
  };

  try {
    const blogs = await db.blog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            claps: true,
            comments: true,
          },
        },
        // The viewer's own clap/bookmark state (not the profile owner's)
        claps: {
          where: {
            userId: viewerId ?? "",
          },
          select: {
            id: true,
          },
        },
        bookmarks: {
          where: {
            userId: viewerId ?? "",
          },
          select: {
            id: true,
          },
        },
      },
    });

    const totalBlogsCount = await db.blog.count({ where });

    const hasMore = totalBlogsCount > page * limit;

    return { success: { blogs, hasMore } };
  } catch {
    return { error: "Error fetching blogs!" };
  }
};
