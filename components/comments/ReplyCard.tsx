import UserSummary from "../blog/UserSummary";
import { CommentWithUser } from "./ListComments";

const ReplyCard = ({ reply }: { reply: CommentWithUser }) => {
  return (
    <div className="p-4 pr-0 flex flex-col gap-2">
      <UserSummary user={reply.user} createdDate={reply.createdAt} />
      <p>{reply.repliedToUser && <span>@{reply.repliedToUser.name}</span>}</p>
    </div>
  );
};

export default ReplyCard;
