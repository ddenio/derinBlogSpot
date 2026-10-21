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
import { useSocket } from "@/context/SocketContext";

const Reactions = ({ blog }: { blog: BlogWithUser }) => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [clapCount, setClapCount] = useState(blog._count.claps);
  const [userHasClapped, setUserHasClapped] = useState(!!blog.claps.length);
  const router = useRouter();
  const { sendNotification } = useSocket();

  const handleClap = async () => {
    if (!userId) return;

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
      sendNotification(blog.userId);
    }

    router.refresh();
  };

  return (
    <div className="flex items-center gap-4 w-full text-sm">
      <span
        onClick={handleClap}
        className="mr-4 flex items-center gap-1 cursor-pointer"
      >
        {userHasClapped ? (
          <FaHandsClapping size={20} />
        ) : (
          <PiHandsClapping size={20} />
        )}
        {clapCount}
      </span>
      <span className="flex items-center gap-1 cursor-pointer">
        <FaRegComment size={18} />
        {blog._count.comments}
      </span>
    </div>
  );
};

export default Reactions;
