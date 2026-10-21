import { getBlogById } from "@/actions/blogs/getblogbyid";
import { auth } from "@/auth";
import CreateBlogForm from "@/components/blog/CreateBlogForm";
import ErrorPage from "@/components/common/ErrorPage";
import Container from "@/components/layout/Container";

interface BlogEditProps {
  params: Promise<{ id: string }>;
}

const BlogEdit = async ({ params }: BlogEditProps) => {
  const { id } = await params;

  const res = await getBlogById({ blogId: id });

  if (!res.success) return (
    <ErrorPage
      variant="notFound"
      title="Post not found"
      message="This post doesn't exist or isn't available to you."
    />
  );

  const blog = res.success.blog;

  if (!blog) return (
    <ErrorPage
      variant="notFound"
      title="Post not found"
      message="This post doesn't exist or isn't available to you."
    />
  );

  const session = await auth();

  if (session?.user.userId !== blog.userId)
    return (
      <ErrorPage
        variant="forbidden"
        title="You can't edit this post"
        message="Only the author can edit a post."
      />
    );

  return (
    <Container>
      <CreateBlogForm blog={blog} />
    </Container>
  );
};

export default BlogEdit;
