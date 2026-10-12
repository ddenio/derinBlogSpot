import { auth } from "@/auth";
import { BlogWithUser } from "../blog/ListBlogs";
import Heading from "../common/Heading";
import AddCommentsForm from "./AddCommentsForm";

const Comments = async ({ blog }: { blog: BlogWithUser }) => {
  const session = await auth();

  const userId = session?.user.userId;

  return (
    <div>
      <Heading title="Comments" />
      {userId && (
        <AddCommentsForm
          blogId={blog.id}
          userId={userId}
          creatorId={blog.userId}
        />
      )}
      {/* list comments */}
    </div>
  );
};

export default Comments;
