import Link from "next/link";
import { BlogWithUser } from "./ListBlogs";
import Image from "next/image";
import UserSummary from "./UserSummary";
import Tag from "../common/Tag";
import Reactions from "./Reactions";
import BookmarkButton from "./BookmarkButton";
import { auth } from "@/auth";
import { Pencil } from "lucide-react";
import { getPostPreview } from "@/lib/blogText";

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
  const { excerpt, minutes } = getPostPreview(blog.content);

  return (
    // The title link is stretched over the whole card (after:inset-0), so the
    // card is clickable. The author, edit, clap and bookmark controls sit above
    // it (relative z-10) and keep working on their own.
    <article className="group relative rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        {blog.user && (
          <UserSummary user={blog.user} createdDate={blog.createdAt} />
        )}
        <div className="flex shrink-0 items-center gap-3">
          {minutes > 0 && (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {minutes} min read
            </span>
          )}
          {(isOwner || isAdmin) && isUserProfile && (
            <Link
              className="relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              href={`/blog/edit/${blog.id}`}
            >
              <Pencil size={14} />
              Edit
            </Link>
          )}
        </div>
      </div>
      {/* Phones: cover on top, text below. From `sm` up: text | cover | bookmark in a row. */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/blog/${blog.id}`}
              className="min-w-0 text-xl font-bold wrap-anywhere transition-colors outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring group-hover:text-primary sm:text-2xl"
            >
              {blog.title}
            </Link>
            {isOwner && isUserProfile && !blog.isPublished && (
              <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                Draft
              </span>
            )}
          </div>
          {excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground sm:text-base">
              {excerpt}
            </p>
          )}
          {!!blog.tags.length && (
            <div className="flex items-center gap-2 flex-wrap my-3">
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
          // Decorative: the title link already names the post
          <div
            aria-hidden
            className="pointer-events-none relative order-first aspect-5/2 w-full overflow-hidden rounded-lg sm:order-none sm:aspect-auto sm:h-30 sm:w-48 sm:shrink-0"
          >
            <Image
              src={blog.coverImage}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              alt=""
              className="object-cover"
            />
          </div>
        )}
        <div className="hidden items-end sm:flex">
          <BookmarkButton blog={blog} />
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
