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

const FollowerList = ({
  user,
  currentUserId,
}: {
  user: UserWithFollows;
  currentUserId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const count = user._count.followers;
  const label = count === 1 ? "Follower" : "Followers";

  if (count === 0) {
    return (
      <span>
        {count} {label}
      </span>
    );
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <span className="cursor-pointer">
            {count} {label}
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-125 w-[90%]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div>
            {user.followers.map((item) => (
              <div
                key={item.follower.id}
                className="flex gap-8 items-center justify-between"
              >
                <UserSummary user={item.follower} />
                {item.follower.id !== currentUserId && (
                  <FollowButton
                    user={item.follower}
                    isFollowing={!!item.follower.followers.length}
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

export default FollowerList;
