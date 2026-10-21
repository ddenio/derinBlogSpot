"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const clapComment = async (commentId: string) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: { blog: { select: { isPublished: true, userId: true } } },
  });

  // Comments on private drafts are only reachable by the draft's author
  if (
    !comment ||
    (!comment.blog.isPublished && comment.blog.userId !== userId)
  )
    return { error: "Comment was not found!" };

  const clap = await db.commentClap.findUnique({
    where: {
      userId_commentId: { userId, commentId },
    },
  });

  if (clap) {
    await db.commentClap.delete({
      where: { id: clap.id },
    });

    return { success: "Unclapped!" };
  } else {
    await db.commentClap.create({
      data: { userId, commentId },
    });
    return { success: "Clapped!" };
  }
};
