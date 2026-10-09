import Link from "next/link";
import { BlogWithUser } from "./ListBlogs";
import Image from "next/image";
import UserSummary from "./UserSummary";
import Tag from "../common/Tag";
import Reactions from "./Reactions";
import { FaRegBookmark } from "react-icons/fa";

const BlogCard = ({
  blog,
  isUserProfile,
}: {
  blog: BlogWithUser;
  isUserProfile?: boolean;
}) => {
  return (
    <div className="border-b border-slate-300 dark:border-slate-700 py-6 cursor-pointer">
      <div>
        {blog.user && (
          <UserSummary user={blog.user} createdDate={blog.createdAt} />
        )}
      </div>
      <div className="my-2 flex justify-between gap-6">
        <div className="flex flex-col justify-between w-full">
          <Link
            href={`/blog/${blog.id}`}
            className="text-xl sm:text-2xl font-bold"
          >
            {blog.title}
          </Link>
          {!!blog.tags.length && (
            <div className="flex items-center gap-4 flex-wrap my-2">
              {blog.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
          <Reactions blog={blog} />
        </div>
        {blog.coverImage && (
          <Link
            href={`/blog/${blog.id}`}
            className="w-full max-w-40 h-25 relative overflow-hidden"
          >
            <Image
              src={blog.coverImage}
              fill
              sizes="160px"
              alt={blog.title}
              className="object-cover rounded-md"
            />
          </Link>
        )}
        <div className="flex items-end cursor-pointer">
          <FaRegBookmark size={18} />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
