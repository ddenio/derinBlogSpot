"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Blog, Comment, Notification, User } from "@/generated/prisma/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getNotifications } from "@/actions/notifications/getNotifications";
import { cn } from "@/lib/utils";
import moment from "moment";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/actions/notifications/markAsRead";

export type LatestNotifications = Notification & {
  sender: Pick<User, "id" | "name">;
  blog: Pick<Blog, "id" | "title"> | null;
  comment: Pick<Comment, "id" | "content" | "blogId"> | null;
};

const Notifications = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.userId;

  const [notifications, setNotifications] = useState<LatestNotifications[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetch when the signed-in user changes or the page changes, so a fresh
  // login (no full reload) or a new notification shows up without a refresh
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const handleFetch = async () => {
      setError(null);

      try {
        const res = await getNotifications();
        if (cancelled) return;

        if (res.success) {
          setNotifications(res.success.notifications);
          setUnreadCount(res.success.unreadNotificationCount);
        }

        if (res.error) {
          setError(res.error);
        }
      } catch (error) {
        if (cancelled) return;
        setError(
          error instanceof Error ? error.message : "An error has occured!",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    handleFetch();

    return () => {
      cancelled = true;
    };
  }, [userId, pathname]);

  const handleOpen = async (n: LatestNotifications) => {
    if (n.entityType === "BLOG" && n.blogId) {
      router.push(`/blog/${n.blogId}/#comments`);
    }

    if (n.entityType === "COMMENT" && n.comment?.blogId) {
      router.push(`/blog/${n.comment?.blogId}/#${n.comment.id}`);
    }

    if (n.entityType === "USER" && n.senderId) {
      router.push(`/user/${n.senderId}/1`);
    }

    await markNotificationAsRead(n.id);
  };

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative cursor-pointer">
        {!!unreadCount && (
          <div className="absolute bg-rose-500 h-6 w-6 rounded-full text-sm flex items-center justify-center bottom-2 left-2">
            <span>{unreadCount}</span>
          </div>
        )}

        <Bell size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full max-w-100">
        <div className="flex gap-4 justify-between mb-2 p-2">
          <h3 className="font-bold text-lg">Notifications</h3>
          <button onClick={markAllAsRead} className="cursor-pointer">
            Mark all as read
          </button>
        </div>

        {loading && (
          <DropdownMenuItem>
            <div className="text-sm text-gray-500">Loading...</div>
          </DropdownMenuItem>
        )}

        {error && (
          <DropdownMenuItem>
            <div className="text-sm text-rose-500">{error}</div>
          </DropdownMenuItem>
        )}

        {!loading &&
          !error &&
          !!notifications.length &&
          notifications.map((n) => {
            return (
              <DropdownMenuItem
                onClick={() => handleOpen(n)}
                key={n.id}
                className={cn(
                  "text-sm cursor-pointer mb-4 flex flex-col items-start border",
                  !n.isRead && "bg-secondary",
                )}
              >
                <div>{n.content}</div>
                <span className="text-xs">
                  {moment(new Date(n.createdAt)).fromNow()}
                </span>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
