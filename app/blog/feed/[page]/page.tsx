import {
  getPublishedBlogs,
  type SearchObj,
} from "@/actions/blogs/get-published-blogs";
import { auth } from "@/auth";
import FeedSidebar from "@/components/blog/FeedSidebar";
import IntroBanner from "@/components/blog/IntroBanner";
import ListBlogs from "@/components/blog/ListBlogs";
import Alert from "@/components/common/Alert";
import EmptyState from "@/components/common/EmptyState";
import { getFeedSidebar } from "@/lib/feedSidebar";
import { FileText, SearchX } from "lucide-react";

interface BlogFeedProps {
  params: Promise<{
    page: string;
  }>;
  searchParams: Promise<SearchObj>;
}

const BlogFeed = async ({ params, searchParams }: BlogFeedProps) => {
  const { page } = await params;
  const { tag, title } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const isFiltered = Boolean(tag || title);

  const [session, { success, error }, sidebar] = await Promise.all([
    auth(),
    getPublishedBlogs({
      page: currentPage,
      limit: 5,
      searchObj: { tag, title },
    }),
    getFeedSidebar(),
  ]);

  let content: React.ReactNode;

  if (error) {
    content = <Alert error message="Error fetching blogs!" />;
  } else if (!success) {
    content = <Alert message="No Blogs!" />;
  } else if (!success.blogs.length) {
    content = (
      <div className="m-auto max-w-200 px-4 pt-4">
        {isFiltered ? (
          <EmptyState
            icon={SearchX}
            title="No posts match your search"
            message="Try a different word or tag."
            action={{ href: "/blog/feed/1", label: "Clear filters" }}
          />
        ) : currentPage > 1 ? (
          <EmptyState
            icon={FileText}
            title="Nothing on this page"
            message="You may have gone past the last page."
            action={{ href: "/blog/feed/1", label: "Back to the first page" }}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            message="Be the first to write one."
            // Writing needs an account, so only offer it to people who have one
            action={
              session?.user
                ? { href: "/blog/create", label: "Write a post" }
                : undefined
            }
          />
        )}
      </div>
    );
  } else {
    content = (
      <ListBlogs
        blogs={success.blogs}
        hasMore={success.hasMore}
        currentPage={currentPage}
        tag={tag}
        title={title}
      />
    );
  }

  // Logged-out visitors get a short welcome on the first, unfiltered page
  const showIntro = !session?.user && currentPage === 1 && !isFiltered;
  // No side column at all when there is nothing to show in it
  const hasSidebar = sidebar.tags.length > 0 || sidebar.topPosts.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl items-start gap-8 lg:pr-4">
      <div className="min-w-0 flex-1">
        <h1 className="sr-only">Latest posts</h1>
        {showIntro && (
          <div className="m-auto max-w-200 px-4 pt-4">
            <IntroBanner />
          </div>
        )}
        {content}
      </div>
      {/* Hidden below lg: phones and tablets just get the feed */}
      {hasSidebar && (
        <aside className="sticky top-36 hidden max-h-[calc(100dvh-9rem)] w-72 shrink-0 overflow-y-auto pt-6 lg:block">
          <FeedSidebar {...sidebar} />
        </aside>
      )}
    </div>
  );
};

export default BlogFeed;
