import { useState } from "react";
import UserSummary from "../blog/UserSummary";
import AddCommentsForm from "./AddCommentsForm";
import CommentReactions from "./CommentReactions";
import { CommentWithUser } from "./ListComments";

const ReplyCard = ({
  reply,
  userId,
}: {
  reply: CommentWithUser;
  userId?: string;
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);

  return (
    <div className="p-4 pr-0 flex flex-col gap-2">
      <UserSummary user={reply.user} createdDate={reply.createdAt} />
      <p>
        {reply.repliedToUser && (
          <span className="rounded px-1 py-0.5 font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            @{reply.repliedToUser.name}
          </span>
        )}{" "}
        {reply.content}
      </p>
      <CommentReactions
        comment={reply}
        setShowForm={setShowForm}
        isReply={true}
      />
      {showForm && (
        <div className="border-l-2 pl-2 my-2 ml-4">
          {userId && showForm && (
            <AddCommentsForm
              blogId={reply.blogId}
              userId={userId}
              parentId={reply.parentId ? reply.parentId : undefined}
              repliedToId={reply.userId}
              placeholder="Add Reply"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReplyCard;
