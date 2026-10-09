import {
  getPublishedBlogs,
  type SearchObj,
} from "@/actions/blogs/get-published-blogs";
import ListBlogs from "@/components/blog/ListBlogs";
import Alert from "@/components/common/Alert";

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

  const { success, error } = await getPublishedBlogs({
    page: currentPage,
    limit: 5,
    searchObj: { tag, title },
  });

  if (error) return <Alert error message="Error fetching blogs!" />;
  if (!success) return <Alert message="No Posts!" />;

  const { blogs, hasMore } = success;

  if (!blogs.length)
    return (
      <Alert
        message={tag || title ? "No posts match your search." : "No Posts!"}
      />
    );

  return (
    <div>
      <ListBlogs
        blogs={blogs}
        hasMore={hasMore}
        currentPage={currentPage}
        tag={tag}
        title={title}
      />
    </div>
  );
};

export default BlogFeed;
