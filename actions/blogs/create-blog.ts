"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import { BlogSchema, BlogSchemaType } from "@/schemas/BlogSchema";

export const createBlog = async (values: BlogSchemaType) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const vFields = BlogSchema.safeParse(values);

  if (!vFields.success) return { error: "Invalid fields!" };

  const { title, content, coverImage, isPublished, tags } = vFields.data;

  const user = await getUserById(userId);

  if (!user) return { error: "User does not exist!" };

  if (isPublished && !user.emailVerified) {
    return { error: "Not authorized! Verify your email!" };
  }

  // The author is always the logged-in user, never a client-supplied id
  await db.blog.create({
    data: {
      userId,
      title,
      content,
      coverImage: coverImage || null,
      isPublished,
      tags,
    },
  });

  if (isPublished) {
    return { success: "Blog published!" };
  }

  return { success: "Blog saved!" };
};
