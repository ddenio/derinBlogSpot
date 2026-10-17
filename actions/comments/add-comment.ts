"use server";

import { getUserById } from "@/lib/user";
import { CommentSchema, CommentSchemaType } from "@/schemas/CommentSchema";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const addComment = async ({
  values,
  userId,
  blogId,
  parentId,
  repliedToUserId,
}: {
  values: CommentSchemaType;
  userId: string;
  blogId: string;
  parentId?: string;
  repliedToUserId?: string;
}) => {
  const vFields = CommentSchema.safeParse(values);

  if (!vFields.success) return { error: "Invalid Fields!" };

  const { content } = vFields.data;

  const user = await getUserById(userId);

  if (!user) return { error: "User not found!" };

  const blog = await db.blog.findUnique({ where: { id: blogId } });

  if (!blog) return { error: "Blog not found!" };

  if (parentId) {
    const parentComment = await db.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) return { error: "Parent Comment not found!" };
  }

  if (repliedToUserId) {
    const repliedToUser = getUserById(repliedToUserId);

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
