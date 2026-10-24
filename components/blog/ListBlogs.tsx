import { Blog, User } from "@/generated/prisma/client";
import Link from "next/link";
import qs from "query-string";
import BlogCard from "./BlogCard";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import EmptyState from "../common/EmptyState";

export type BlogWithUser = Blog & {
  user: Pick<User, "id" | "name" | "image">;
  _count: {
    claps: number;
    comments: number;
  };
  claps: {
    id: string;
  }[];
  bookmarks: {
    id: string;
  }[];
};

interface ListBlogsProps {
  blogs: BlogWithUser[];
  hasMore: boolean;
  currentPage: number;
  isUserProfile?: boolean;
  tag?: string;
  title?: string;
  basePath?: string;
  // Shown instead of the list when there are no posts
  emptyState?: React.ReactNode;
}

const pageButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const ListBlogs = ({
  blogs,
  hasMore,
  currentPage,
  isUserProfile,
  tag,
  title,
  basePath = "/blog/feed",
  emptyState,
}: ListBlogsProps) => {
  const pageHref = (page: number) =>
    qs.stringifyUrl(
      { url: `${basePath}/${page}`, query: { tag, title } },
      { skipNull: true, skipEmptyString: true },
    );

  if (!blogs.length)
    return (
      <div className="m-auto max-w-200 px-4 pt-4">
        {emptyState ?? (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            message={
              currentPage > 1
                ? "There is nothing on this page."
                : "Posts will show up here."
            }
            action={
              currentPage > 1
                ? { href: pageHref(1), label: "Back to the first page" }
                : undefined
            }
          />
        )}
      </div>
    );

  return (
    <div className="flex flex-col max-w-200 m-auto justify-between min-h-[85vh] px-4 pt-2">
      <section className="flex flex-col gap-4">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} isUserProfile={isUserProfile} />
        ))}
      </section>

      <div className="flex items-center mt-6 pb-4">
        {currentPage > 1 && (
          <Link href={pageHref(currentPage - 1)} className={pageButtonClass}>
            <ChevronLeft size={16} />
            Previous
          </Link>
        )}
        {hasMore && (
          <Link
            href={pageHref(currentPage + 1)}
            className={`${pageButtonClass} ml-auto`}
          >
            Next
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ListBlogs;
