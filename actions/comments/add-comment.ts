"use server";

import { auth } from "@/auth";
import { CommentSchema, CommentSchemaType } from "@/schemas/CommentSchema";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const addComment = async ({
  values,
  blogId,
  parentId,
  repliedToUserId,
}: {
  values: CommentSchemaType;
  blogId: string;
  parentId?: string;
  repliedToUserId?: string;
}) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const vFields = CommentSchema.safeParse(values);

  if (!vFields.success) return { error: "Invalid Fields!" };

  const { content } = vFields.data;

  const blog = await db.blog.findUnique({ where: { id: blogId } });

  // Drafts are private: only their author can comment on them
  if (!blog || (!blog.isPublished && blog.userId !== userId))
    return { error: "Blog not found!" };

  if (parentId) {
    const parentComment = await db.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment || parentComment.blogId !== blogId)
      return { error: "Parent Comment not found!" };
  }

  if (repliedToUserId) {
    const repliedToUser = await db.user.findUnique({
      where: { id: repliedToUserId },
      select: { id: true },
    });

    if (!repliedToUser) return { error: "Replying to user not found!" };
  }

  await db.comment.create({
    data: {
      userId,
      blogId,
      parentId,
      repliedToUserId,
      content,
    },
  });

  revalidatePath(`/blog/${blogId}`);

  return { success: "Comment added successfully!" };
};
