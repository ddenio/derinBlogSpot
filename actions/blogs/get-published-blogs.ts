"use server";

import { db } from "@/lib/db";

interface GetPublishedBlogsParams {
  page?: number;
  limit?: number;
  tag?: string;
}

export const getPublishedBlogs = async ({
  page = 1,
  limit = 5,
  tag,
}: GetPublishedBlogsParams) => {
  const skip = (page - 1) * limit;
  const where = {
    isPublished: true,
    ...(tag ? { tags: { has: tag } } : {}),
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
      },
    });

    const totalBlogsCount = await db.blog.count({ where });

    const hasMore = totalBlogsCount > page * limit;

    return { success: { blogs, hasMore } };
  } catch {
    return { error: "Error fetching blogs!" };
  }
};
