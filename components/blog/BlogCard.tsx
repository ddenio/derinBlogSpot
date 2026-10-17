import Link from "next/link";
import { BlogWithUser } from "./ListBlogs";
import Image from "next/image";
import UserSummary from "./UserSummary";
import Tag from "../common/Tag";
import Reactions from "./Reactions";
import BookmarkButton from "./BookmarkButton";
import { auth } from "@/auth";
import { Pencil } from "lucide-react";

const BlogCard = async ({
  blog,
  isUserProfile,
}: {
  blog: BlogWithUser;
  isUserProfile?: boolean;
}) => {
  const session = await auth();
  const userId = session?.user.userId;
  const isOwner = userId === blog.userId;
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="border-b border-slate-300 dark:border-slate-700 py-6 cursor-pointer">
      <div className="flex items-center justify-between">
        {blog.user && (
          <UserSummary user={blog.user} createdDate={blog.createdAt} />
        )}
        {(isOwner || isAdmin) && isUserProfile && (
          <Link
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            href={`/blog/edit/${blog.id}`}
          >
            <Pencil size={14} />
            Edit
          </Link>
        )}
      </div>
      <div className="my-2 flex justify-between gap-6">
        <div className="flex flex-col justify-between w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/blog/${blog.id}`}
              className="text-xl sm:text-2xl font-bold"
            >
              {blog.title}
            </Link>
            {isOwner && isUserProfile && !blog.isPublished && (
              <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                Draft
              </span>
            )}
          </div>
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
        <div className="flex items-end">
          <BookmarkButton blog={blog} />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
