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
      {/* Phones: cover on top, text below. From `sm` up: text | cover | bookmark in a row. */}
      <div className="my-2 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/blog/${blog.id}`}
              className="min-w-0 text-xl sm:text-2xl font-bold wrap-anywhere"
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
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap my-2">
              {blog.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <Reactions blog={blog} />
            {/* Phones keep the bookmark beside the reactions */}
            <div className="sm:hidden">
              <BookmarkButton blog={blog} />
            </div>
          </div>
        </div>
        {blog.coverImage && (
          <Link
            href={`/blog/${blog.id}`}
            className="relative order-first aspect-5/2 w-full overflow-hidden sm:order-none sm:aspect-auto sm:h-25 sm:w-40 sm:shrink-0"
          >
            <Image
              src={blog.coverImage}
              fill
              sizes="(max-width: 640px) 100vw, 160px"
              alt={blog.title}
              className="object-cover rounded-md"
            />
          </Link>
        )}
        <div className="hidden items-end sm:flex">
          <BookmarkButton blog={blog} />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
