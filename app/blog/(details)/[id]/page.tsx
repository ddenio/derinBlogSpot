import { getBlogById } from "@/actions/blogs/getblogbyid";
import { auth } from "@/auth";
import BlogContentViewer from "@/components/blog/editor/BlogContentViewer";
import Reactions from "@/components/blog/Reactions";
import UserSummary from "@/components/blog/UserSummary";
import Alert from "@/components/common/Alert";
import Tag from "@/components/common/Tag";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaRegBookmark } from "react-icons/fa";

import "./editor.css";

interface BlogContentProps {
  params: Promise<{
    id: string;
  }>;
}

const BlogContent = async ({ params }: BlogContentProps) => {
  const session = await auth();
  const { id } = await params;

  const res = await getBlogById({ blogId: id });

  if (!res.success)
    return <Alert error message="Error fetching blog content!" />;

  const blog = res.success.blog;

  if (!blog) return <Alert error message="No Blog found!" />;

  return (
    <div className="flex flex-col max-w-225 m-auto gap-6">
      {blog.coverImage && (
        <div className="relative w-full aspect-5/2 mt-2 overflow-hidden">
          <Image
            src={blog.coverImage}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            priority
            alt="Cover Image"
            className="object-cover rounded"
          />
        </div>
      )}
      <div className="flex justify-between items-center pt-4">
        {blog.user && (
          <UserSummary user={blog.user} createdDate={blog.createdAt} />
        )}
        {session?.user.userId === blog.userId && (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={`/blog/edit/${blog.id}`}
          >
            <Pencil />
            Edit
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Separator />
        <div className="flex items-center justify-between">
          <Reactions blog={blog} />
          <div className="cursor-pointer">
            <FaRegBookmark size={18} />
          </div>
        </div>
        <Separator />
      </div>
      <h2 className="text-4xl font-bold">{blog.title}</h2>
      {!!blog.tags.length && (
        <div className="flex items-center gap-4 flex-wrap">
          {blog.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}
      <div>
        <BlogContentViewer content={blog.content} />
      </div>
    </div>
  );
};

export default BlogContent;
