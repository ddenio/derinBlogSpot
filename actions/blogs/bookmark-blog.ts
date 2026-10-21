"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const bookmarkBlog = async (blogId: string) => {
  const session = await auth();
  const userId = session?.user.userId;

  if (!userId) return { error: "Not authenticated!" };

  const blog = await db.blog.findUnique({
    where: { id: blogId },
  });

  // Drafts are private: only their author can interact with them
  if (!blog || (!blog.isPublished && blog.userId !== userId))
    return { error: "Blog not found!" };

  const bookmark = await db.bookmark.findUnique({
    where: {
      userId_blogId: { userId, blogId },
    },
  });

  if (bookmark) {
    await db.bookmark.delete({
      where: { id: bookmark.id },
    });

    return { success: "Bookmark Removed!" };
  } else {
    await db.bookmark.create({
      data: { userId, blogId },
    });
    return { success: "Blog Bookmarked!" };
  }
};
