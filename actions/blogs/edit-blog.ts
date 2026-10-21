"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import { BlogSchema, BlogSchemaType } from "@/schemas/BlogSchema";

export const editBlog = async (values: BlogSchemaType, blogId: string) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const vFields = BlogSchema.safeParse(values);

  if (!vFields.success) return { error: "Invalid Fields!" };

  const { title, content, coverImage, isPublished, tags } = vFields.data;

  const user = await getUserById(userId);

  if (!user) return { error: "User does not exist!" };

  if (isPublished && !user.emailVerified) {
    return { error: "Not authorized! Verify your email!" };
  }

  const blog = await db.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) return { error: "Blog not found!" };

  if (blog.userId !== userId) return { error: "Unauthorized!" };

  // Only whitelisted fields are updated; ownership (userId) can never change
  await db.blog.update({
    where: { id: blogId },
    // `|| null` so removing the cover really clears it (undefined = unchanged)
    data: {
      title,
      content,
      coverImage: coverImage || null,
      isPublished,
      tags,
    },
  });

  return { success: "Blog Updated" };
};
