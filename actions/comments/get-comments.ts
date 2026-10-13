"use server";

import { db } from "@/lib/db";

const commentInclude = {
  user: { select: { id: true, name: true, image: true } },
  repliedToUser: { select: { id: true, name: true } },
  _count: { select: { replies: true } },
};

export const getComments = async (
  blogId: string,
  parentId: string | null,
  userId?: string,
) => {
  try {
    const comments = await db.comment.findMany({
      where: { blogId, parentId: parentId },
      orderBy: { createdAt: parentId ? "asc" : "desc" },
      include: {
        ...commentInclude,
        replies: {
          orderBy: { createdAt: "asc" },
          include: commentInclude,
        },
      },
    });

    return { success: { comments } };
  } catch {
    return { error: "Error fetching comments!" };
  }
};
