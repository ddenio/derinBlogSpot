"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { backendClient } from "@/lib/edgestore-server";
import { getBlogFileUrls } from "@/lib/blogFiles";

export const deleteBlog = async (blogId: string) => {
  const session = await auth();
  const userId = session?.user.userId;

  const blog = await db.blog.findUnique({ where: { id: blogId } });

  if (!blog) return { error: "Blog not found!" };

  if (blog.userId !== userId) return { error: "Unauthorized!" };

  await db.blog.delete({
    where: { id: blog.id },
  });

  // Clean up EdgeStore files after the DB delete. A failed file delete must
  // never make the blog delete fail, so each one is best-effort.
  const urls = getBlogFileUrls(blog.coverImage, blog.content);

  await Promise.all(
    urls.map(async (url) => {
      try {
        // Skip files another blog still references.
        const stillUsed = await db.blog.count({
          where: { OR: [{ coverImage: url }, { content: { contains: url } }] },
        });

        if (stillUsed > 0) return;

        await backendClient.publicFiles.deleteFile({ url });
      } catch (error) {
        console.error("EdgeStore file delete failed:", url, error);
      }
    }),
  );

  return { success: "Blog deleted" };
};
