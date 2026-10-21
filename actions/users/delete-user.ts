"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBlogFileUrls } from "@/lib/blogFiles";
import { backendClient } from "@/lib/edgestore-server";
import { getUserById } from "@/lib/user";

export const deleteUser = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) return { error: "User not found!" };

  const session = await auth();

  if (session?.user.userId !== userId) return { error: "Not authorized!" };

  // Collect every uploaded file (covers AND images/media inside posts) before
  // the posts are gone, so none of the user's files are left behind.
  const blogs = await db.blog.findMany({
    where: { userId: user.id },
    select: { coverImage: true, content: true },
  });

  const fileUrls = new Set<string>();

  blogs.forEach((blog) => {
    getBlogFileUrls(blog.coverImage, blog.content).forEach((url) =>
      fileUrls.add(url),
    );
  });

  try {
    await db.user.delete({
      where: { id: userId },
    });
  } catch {
    return { error: "Failed to delete user!" };
  }

  // Delete the files only after the account is really gone, so a failed
  // account delete never leaves the user with broken posts. Best-effort: a
  // failed file delete must not make the account deletion look like it failed.
  await Promise.all(
    [...fileUrls].map(async (url) => {
      try {
        await backendClient.publicFiles.deleteFile({ url });
      } catch (error) {
        console.error(`Failed to delete file: ${url}`, error);
      }
    }),
  );

  return { success: "User Account deleted!" };
};
