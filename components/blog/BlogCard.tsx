import Link from "next/link";
import { BlogWithUser } from "./ListBlogs";
import Image from "next/image";

const BlogCard = ({
  blog,
  isUserProfile,
}: {
  blog: BlogWithUser;
  isUserProfile?: boolean;
}) => {
  return (
    <div className="border-b border-slate-300 dark:border-slate-700 py-6 cursor-pointer">
      <div>UserSummary</div>
      <div className="my-2 flex justify-between gap-6">
        <div className="flex flex-col justify-between w-full">
          <Link
            href={`/blog/${blog.id}`}
            className="text-xl sm:text-2xl font-bold"
          >
            {blog.title}
          </Link>
          {!!blog.tags.length && (
            <div>
              {blog.tags.map((tag) => (
                <span>{tag}</span>
              ))}
            </div>
          )}
          <p>Reactions</p>
        </div>
        {blog.coverImage && (
          <Link
            href={`/blog/${blog.id}`}
            className="w-full max-w-40 h-25 relative overflow-hidden"
          >
            <Image
              src={blog.coverImage}
              fill
              alt={blog.title}
              className="object-cover rounded-md"
            />
          </Link>
        )}
      </div>
    </div>
  );
};

export default BlogCard;
