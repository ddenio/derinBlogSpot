import { Blog, User } from "@/generated/prisma/client";
import Link from "next/link";
import qs from "query-string";
import BlogCard from "./BlogCard";

export type BlogWithUser = Blog & {
  user: Pick<User, "id" | "name" | "image">;
  _count: {
    claps: number;
  };
  claps: {
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
}

const ListBlogs = ({
  blogs,
  hasMore,
  currentPage,
  isUserProfile,
  tag,
  title,
}: ListBlogsProps) => {
  const pageHref = (page: number) =>
    qs.stringifyUrl(
      { url: `/blog/feed/${page}`, query: { tag, title } },
      { skipNull: true, skipEmptyString: true },
    );

  return (
    <div className="flex flex-col max-w-200 m-auto justify-between min-h-[85vh] px-4 pt-2">
      <section>
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} isUserProfile={isUserProfile} />
        ))}
      </section>

      <div className="flex justify-between mt-4">
        {currentPage > 1 && (
          <Link href={pageHref(currentPage - 1)}>
            <span>Previous</span>
          </Link>
        )}
        {hasMore && (
          <Link href={pageHref(currentPage + 1)}>
            <span>Next</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ListBlogs;
