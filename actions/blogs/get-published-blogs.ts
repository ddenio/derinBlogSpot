"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface SearchObj {
  tag?: string;
  title?: string;
}

interface GetPublishedBlogsParams {
  page?: number;
  limit?: number;
  searchObj?: SearchObj;
}

export const getPublishedBlogs = async ({
  page = 1,
  limit = 5,
  searchObj,
}: GetPublishedBlogsParams) => {
  const skip = (page - 1) * limit;
  const { tag, title } = searchObj ?? {};

  const session = await auth();
  const userId = session?.user.userId;

  const where = {
    isPublished: true,
    ...(tag ? { tags: { has: tag } } : {}),
    ...(title
      ? { title: { contains: title, mode: "insensitive" as const } }
      : {}),
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
          },
        },
        claps: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
        bookmarks: {
          where: {
            userId,
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
