"use server";

import { db } from "@/lib/db";
import { getBlogById } from "../blogs/getblogbyid";

export const getComments = async (
  blogId: string,
  parentId: string | null,
  userId?: string,
) => {
  const blog = await getBlogById({ blogId });

  if (!blog) return { error: "Blog not found!" };

  try {
    const comments = await db.comment.findMany({
      where: { blogId, parentId: parentId },
      orderBy: { createdAt: parentId ? "asc" : "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        repliedToUser: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            replies: true,
            //claps: true
          },
        },
      },
    });

    return { success: { comments } };
  } catch {
    return { error: "Error fetching comments!" };
  }
};
