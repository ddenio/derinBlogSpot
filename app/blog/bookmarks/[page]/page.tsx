import { getBookmarks } from "@/actions/blogs/get-bookmarks";
import ListBlogs from "@/components/blog/ListBlogs";
import Alert from "@/components/common/Alert";
import EmptyState from "@/components/common/EmptyState";
import Heading from "@/components/common/Heading";
import { Bookmark } from "lucide-react";

interface BookmarksProps {
  params: Promise<{
    page: string;
  }>;
}

const Bookmarks = async ({ params }: BookmarksProps) => {
  const { page } = await params;

  const currentPage = parseInt(page, 10) || 1;

  const { success, error } = await getBookmarks({
    page: currentPage,
    limit: 5,
  });

  if (error) return <Alert error message="Error fetching blogs!" />;
  if (!success) return <Alert message="No Blogs!" />;

  const { blogs, hasMore } = success;

  return (
    <div>
      <div className="max-w-200 m-auto mt-4 px-4">
        <Heading title="Bookmarks" lg />
      </div>
      <ListBlogs
        blogs={blogs}
        hasMore={hasMore}
        currentPage={currentPage}
        basePath="/blog/bookmarks"
        emptyState={
          <EmptyState
            icon={Bookmark}
            title="No bookmarks yet"
            message="Tap the bookmark icon on a post to save it for later."
            action={{ href: "/blog/feed/1", label: "Browse posts" }}
          />
        }
      />
    </div>
  );
};

export default Bookmarks;
