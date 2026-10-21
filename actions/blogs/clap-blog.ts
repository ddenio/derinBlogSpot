"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const clapBlog = async (blogId: string) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const blog = await db.blog.findUnique({
    where: { id: blogId },
  });

  // Drafts are private: only their author can interact with them
  if (!blog || (!blog.isPublished && blog.userId !== userId))
    return { error: "Blog not found!" };

  const clap = await db.clap.findUnique({
    where: {
      userId_blogId: { userId, blogId },
    },
  });

  if (clap) {
    await db.clap.delete({
      where: { id: clap.id },
    });

    return { success: "Unclapped!" };
  } else {
    await db.clap.create({
      data: { userId, blogId },
    });
    return { success: "Clapped!" };
  }
};
