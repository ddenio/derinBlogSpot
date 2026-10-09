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
  const router = useRouter();

  const handleBookmark = async () => {
    if (!userId) return;

    setUserHasBookmarked((prevState) => !prevState);

    const res = await bookmarkBlog(blog.id, userId);

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
      className="cursor-pointer"
    >
      {userHasBookmarked ? (
        <FaBookmark size={18} />
      ) : (
        <FaRegBookmark size={18} />
      )}
    </button>
  );
};

export default BookmarkButton;
