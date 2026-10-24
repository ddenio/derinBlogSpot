"use client";

import { PiHandsClapping } from "react-icons/pi";
import { FaRegComment } from "react-icons/fa";
import { FaHandsClapping } from "react-icons/fa6";
import { useState } from "react";
import { BlogWithUser } from "./ListBlogs";
import { useSession } from "next-auth/react";
import { clapBlog } from "@/actions/blogs/clap-blog";
import { useRouter } from "next/navigation";
import { createNotification } from "@/actions/notifications/createNotification";

const Reactions = ({ blog }: { blog: BlogWithUser }) => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [clapCount, setClapCount] = useState(blog._count.claps);
  const [userHasClapped, setUserHasClapped] = useState(!!blog.claps.length);
  // Bumped on each new clap so the icon replays its little "pop"
  const [popCount, setPopCount] = useState(0);
  const router = useRouter();

  const handleClap = async () => {
    if (!userId) return;

    if (!userHasClapped) setPopCount((count) => count + 1);

    setClapCount((prevCount) =>
      userHasClapped ? prevCount - 1 : prevCount + 1,
    );
    setUserHasClapped((prevState) => !prevState);

    const res = await clapBlog(blog.id);

    // Only notify the author on a new clap (not an unclap, not your own post)
    if (res.success === "Clapped!" && blog.userId !== userId) {
      await createNotification({
        recipientId: blog.userId,
        type: "NEW_CLAP",
        blogId: blog.id,
        entityType: "BLOG",
      });
    }

    router.refresh();
  };

  return (
    <div className="flex items-center gap-4 w-full text-sm">
      {/* -my-2 -ml-2 + p-2 gives a 40px touch target without moving anything */}
      <button
        type="button"
        onClick={handleClap}
        aria-label={userHasClapped ? "Remove clap" : "Clap for this post"}
        aria-pressed={userHasClapped}
        className="relative z-10 -my-2 -ml-2 mr-2 flex items-center gap-1 p-2 cursor-pointer"
      >
        <span
          key={popCount}
          className={
            popCount ? "inline-flex motion-safe:animate-pop" : "inline-flex"
          }
        >
          {userHasClapped ? (
            <FaHandsClapping size={20} />
          ) : (
            <PiHandsClapping size={20} />
          )}
        </span>
        {clapCount}
      </button>
      <span className="flex items-center gap-1 cursor-pointer">
        <FaRegComment size={18} />
        {blog._count.comments}
      </span>
    </div>
  );
};

export default Reactions;
