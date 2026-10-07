import { Blog, User } from "@/generated/prisma/client";
import Link from "next/link";
import BlogCard from "./BlogCard";

export type BlogWithUser = Blog & {
  user: Pick<User, "id" | "name" | "image">;
};

interface ListBlogsProps {
  blogs: BlogWithUser[];
  hasMore: boolean;
  currentPage: number;
  isUserProfile?: boolean;
}

const ListBlogs = ({
  blogs,
  hasMore,
  currentPage,
  isUserProfile,
}: ListBlogsProps) => {
  return (
    <div className="flex flex-col max-w-200 m-auto justify-between min-h-[85vh] px-4 pt-2">
      <section>
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} isUserProfile={isUserProfile} />
        ))}
      </section>

      <div className="flex justify-between mt-4">
        {currentPage > 1 && (
          <Link href={`/blog/feed/${currentPage - 1}`}>
            <span>Previous</span>
          </Link>
        )}
        {hasMore && (
          <Link href={`/blog/feed/${currentPage + 1}`}>
            <span>Next</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ListBlogs;
