import { Blog, User } from "@/generated/prisma/client";
import Link from "next/link";
import qs from "query-string";
import BlogCard from "./BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

const pageButtonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800";

const ListBlogs = ({
  blogs,
  hasMore,
  currentPage,
  isUserProfile,
  tag,
  title,
  basePath = "/blog/feed",
}: ListBlogsProps) => {
  const pageHref = (page: number) =>
    qs.stringifyUrl(
      { url: `${basePath}/${page}`, query: { tag, title } },
      { skipNull: true, skipEmptyString: true },
    );

  return (
    <div className="flex flex-col max-w-200 m-auto justify-between min-h-[85vh] px-4 pt-2">
      <section>
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
