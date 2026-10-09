"use client";

import { PiHandsClapping } from "react-icons/pi";
import { FaRegComment } from "react-icons/fa";
import { FaHandsClapping } from "react-icons/fa6";
import { useState } from "react";
import { BlogWithUser } from "./ListBlogs";
import { useSession } from "next-auth/react";
import { clapBlog } from "@/actions/blogs/clap-blog";
import { useRouter } from "next/navigation";

const Reactions = ({ blog }: { blog: BlogWithUser }) => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [clapCount, setClapCount] = useState(blog._count.claps);
  const [userHasClapped, setUserHasClapped] = useState(!!blog.claps.length);
  const router = useRouter();

  const handleClap = async () => {
    if (!userId) return;

    setClapCount((prevCount) =>
      userHasClapped ? prevCount - 1 : prevCount + 1,
    );
    setUserHasClapped((prevState) => !prevState);

    await clapBlog(blog.id, userId);
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
        {3}
      </span>
    </div>
  );
};

export default Reactions;
