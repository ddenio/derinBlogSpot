"use client";

import UserSummary from "../blog/UserSummary";
import { CommentWithUser } from "./ListComments";

const CommentCard = ({ comment }: { comment: CommentWithUser }) => {
  return (
    <div className="border-2 p-4 flex flex-col gap-2 rounded-md mt-6">
      <UserSummary user={comment.user} createdDate={comment.createdAt} />
      <p>{comment.content}</p>
      {/* reactions */}
    </div>
  );
};

export default CommentCard;
