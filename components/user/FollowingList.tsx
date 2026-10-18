"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserWithFollows } from "./UserProfile";
import UserSummary from "../blog/UserSummary";
import FollowButton from "./FollowButton";

const FollowingList = ({
  user,
  currentUserId,
}: {
  user: UserWithFollows;
  currentUserId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const count = user._count.followings;

  if (count === 0) {
    return <span>{count} Following</span>;
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <span className="cursor-pointer">{count} Following</span>
        </DialogTrigger>
        <DialogContent className="max-w-125 w-[90%]">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div>
            {user.followings.map((item) => (
              <div
                key={item.following.id}
                className="flex gap-8 items-center justify-between"
              >
                <UserSummary user={item.following} />
                {item.following.id !== currentUserId && (
                  <FollowButton
                    user={item.following}
                    isFollowing={!!item.following.followers.length}
                    isList={true}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowingList;
