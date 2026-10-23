"use client";

import { useEffect } from "react";
import { BLOG_VIEWED } from "@/lib/analytics/events";
import { trackClientEvent } from "@/lib/analytics/posthogClient";

// Records that a blog was viewed. Only the id is sent: titles are looked up
// from the database later, so renames never leave stale names behind.
const BlogViewTracker = ({ blogId }: { blogId: string }) => {
  useEffect(() => {
    trackClientEvent(BLOG_VIEWED, { blog_id: blogId });
  }, [blogId]);

  return null;
};

export default BlogViewTracker;
