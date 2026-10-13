"use client";

import { cn } from "@/lib/utils";
import { CommentWithUser } from "./ListComments";
import { Dispatch, SetStateAction } from "react";
import { FaHandsClapping } from "react-icons/fa6";
import { FaRegComment } from "react-icons/fa";
import { BsReply } from "react-icons/bs";
import { MdDeleteOutline } from "react-icons/md";
import { useSession } from "next-auth/react";

interface CommentReactionsProps {
  comment: CommentWithUser;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setShowReplies: Dispatch<SetStateAction<boolean>>;
  isReply?: boolean;
}

const CommentReactions = ({
  comment,
  setShowForm,
  setShowReplies,
  isReply,
}: CommentReactionsProps) => {
  const session = useSession();
  const userId = session.data?.user.userId;

  const handleReply = () => {
    setShowForm((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center w-full text-sm mt-2 gap-4",
        isReply && "justify-start ml-2",
      )}
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 cursor-pointer">
          <FaHandsClapping size={20} /> {4}
        </span>
        {!isReply && (
          <span className="flex items-center gap-1 cursor-pointer">
            <FaRegComment size={20} />
            Replies {comment._count.replies}
          </span>
        )}
      </div>
      <div className="flex items-center">
        <span
          onClick={handleReply}
          className="flex items-center gap-1 cursor-pointer mr-4"
        >
          <BsReply size={20} />
          Reply
        </span>
        {userId === comment.userId && (
          <span className="cursor-pointer">
            <MdDeleteOutline size={20} />
          </span>
        )}
      </div>
    </div>
  );
};

export default CommentReactions;
