import { getBlogById } from "@/actions/blogs/getblogbyid";
import { auth } from "@/auth";
import CreateBlogForm from "@/components/blog/CreateBlogForm";
import Alert from "@/components/common/Alert";
import Container from "@/components/layout/Container";

interface BlogEditProps {
  params: Promise<{ id: string }>;
}

const BlogEdit = async ({ params }: BlogEditProps) => {
  const { id } = await params;

  const res = await getBlogById({ blogId: id });

  if (!res.success) return <Alert error message="Error getting blog" />;

  const blog = res.success.blog;

  if (!blog) return <Alert error message="No blog was found" />;

  const session = await auth();

  if (session?.user.userId !== blog.userId)
    return <Alert error message="Not authorized!" />;

  return (
    <Container>
      <CreateBlogForm blog={blog} />
    </Container>
  );
};

export default BlogEdit;
