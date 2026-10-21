"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getBlogById = async ({ blogId }: { blogId: string }) => {
  if (!blogId) return { error: "Blog doesn't exist!" };

  const session = await auth();
  const userId = session?.user.userId;

  try {
    const blog = await db.blog.findUnique({
      where: { id: blogId },
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

    // Drafts are private: only their author can load them
    if (blog && !blog.isPublished && blog.userId !== userId) {
      return { error: "Blog doesn't exist!" };
    }

    return { success: { blog } };
  } catch {
    return { error: "Error fetching blog content!" };
  }
};
