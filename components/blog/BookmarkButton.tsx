"use client";

import { useState } from "react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { bookmarkBlog } from "@/actions/blogs/bookmark-blog";
import { BlogWithUser } from "./ListBlogs";

const BookmarkButton = ({
  blog,
}: {
  blog: Pick<BlogWithUser, "id" | "bookmarks">;
}) => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [userHasBookmarked, setUserHasBookmarked] = useState(
    !!blog.bookmarks.length,
  );
  // Bumped on each new bookmark so the icon replays its little "pop"
  const [popCount, setPopCount] = useState(0);
  const router = useRouter();

  const handleBookmark = async () => {
    if (!userId) return;

    if (!userHasBookmarked) setPopCount((count) => count + 1);

    setUserHasBookmarked((prevState) => !prevState);

    const res = await bookmarkBlog(blog.id);

    // Roll back the optimistic update if the server rejected it
    if (res.error) setUserHasBookmarked((prevState) => !prevState);

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleBookmark}
      aria-label={userHasBookmarked ? "Remove bookmark" : "Bookmark this post"}
      aria-pressed={userHasBookmarked}
      className="relative z-10 -m-2 p-2 cursor-pointer"
    >
      <span
        key={popCount}
        className={
          popCount ? "inline-flex motion-safe:animate-pop" : "inline-flex"
        }
      >
        {userHasBookmarked ? (
          <FaBookmark size={18} />
        ) : (
          <FaRegBookmark size={18} />
        )}
      </span>
    </button>
  );
};

export default BookmarkButton;
