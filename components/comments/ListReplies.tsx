import { CommentWithUser } from "./ListComments";
import ReplyCard from "./ReplyCard";

const ListReplies = ({
  replies,
  userId,
}: {
  replies: CommentWithUser[];
  userId?: string;
}) => {
  return (
    <div className="text-sm">
      {replies.map((r) => (
        <div key={r.id}>
          <ReplyCard reply={r} userId={userId} />
        </div>
      ))}
    </div>
  );
};

export default ListReplies;
