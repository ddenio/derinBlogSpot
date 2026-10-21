"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const commentInclude = (userId?: string) => ({
  user: { select: { id: true, name: true, image: true } },
  repliedToUser: { select: { id: true, name: true } },
  _count: { select: { replies: true, claps: true } },
  // Only the viewer's own clap (0 or 1 rows) so we know if they've clapped.
  // Logged-out viewers get "" so the filter matches nothing instead of
  // `userId: undefined`, which Prisma would treat as "no filter".
  claps: {
    where: { userId: userId ?? "" },
    select: { id: true },
  },
});

export const getComments = async (
  blogId: string,
  parentId: string | null,
) => {
  // The viewer always comes from the session, never from a client argument
  const session = await auth();
  const userId = session?.user.userId;

  try {
    // Comments on a draft are private to the draft's author
    const blog = await db.blog.findUnique({
      where: { id: blogId },
      select: { isPublished: true, userId: true },
    });

    if (!blog || (!blog.isPublished && blog.userId !== userId)) {
      return { error: "Error fetching comments!" };
    }

    const comments = await db.comment.findMany({
      where: { blogId, parentId: parentId },
      orderBy: { createdAt: parentId ? "asc" : "desc" },
      include: {
        ...commentInclude(userId),
        replies: {
          orderBy: { createdAt: "asc" },
          include: commentInclude(userId),
        },
      },
    });

    return { success: { comments } };
  } catch {
    return { error: "Error fetching comments!" };
  }
};
