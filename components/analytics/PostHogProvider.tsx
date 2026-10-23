"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { syncAnalytics } from "@/lib/analytics/posthogClient";

// Starts analytics once the session is known. Renders nothing.
const PostHogProvider = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.userId;
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;

    syncAnalytics(userId, isAdmin);
  }, [status, userId, isAdmin]);

  return null;
};

export default PostHogProvider;
