"use server";

import { auth } from "@/auth";
import { EntityType, NotificationType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const createNotification = async ({
  recipientId,
  type,
  blogId,
  commentId,
  entityType,
  content,
}: {
  recipientId: string;
  type: NotificationType;
  entityType?: EntityType;
  content?: string;
  blogId?: string;
  commentId?: string;
}) => {
  const session = await auth();
  if (!session?.user) {
    return { error: "Not Authenticated!" };
  }

  const senderId = session.user.userId;

  if (senderId === recipientId) {
    return { error: "Failed to send notification to self!" };
  }

  // Only admins may send free-text system alerts
  if (type === "SYSTEM_ALERT" && session.user.role !== "ADMIN") {
    return { error: "Not authorized!" };
  }

  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });

  if (!recipient) {
    return { error: "Recipient not found!" };
  }

  // Make sure the notification matches something that really happened, so a
  // user can't fabricate notifications for arbitrary people.
  switch (type) {
    case "NEW_COMMENT": {
      const comment = blogId
        ? await db.comment.findFirst({
            where: { blogId, userId: senderId, blog: { userId: recipientId } },
          })
        : null;
      if (!comment) return { error: "Invalid notification!" };
      break;
    }
    case "COMMENT_REPLY": {
      const reply = commentId
        ? await db.comment.findFirst({
            where: {
              parentId: commentId,
              userId: senderId,
              repliedToUserId: recipientId,
            },
          })
        : null;
      if (!reply) return { error: "Invalid notification!" };
      break;
    }
    case "NEW_CLAP": {
      const clap = blogId
        ? await db.clap.findFirst({
            where: { blogId, userId: senderId, blog: { userId: recipientId } },
          })
        : null;
      if (!clap) return { error: "Invalid notification!" };
      break;
    }
    case "FOLLOW": {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: senderId,
            followingId: recipientId,
          },
        },
      });
      if (!follow) return { error: "Invalid notification!" };
      break;
    }
    case "SYSTEM_ALERT":
      break;
    default:
      return { error: "Invalid notification type!" };
  }

  try {
    await db.notification.create({
      data: {
        senderId,
        recipientId,
        type,
        blogId,
        commentId,
        entityType,
        // Only system alerts carry free text from the caller
        content: type === "SYSTEM_ALERT" ? content : undefined,
      },
    });

    return { success: "Notification sent!" };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { error: "Failed to send notification!" };
  }
};
