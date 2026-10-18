"use client";

import { User } from "@/generated/prisma/client";
import Button from "../common/Button";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const FollowButton = ({
  user,
  isFollowing: following,
  isList = false,
}: {
  user: User | Pick<User, "id" | "name" | "image">;
  isFollowing: boolean;
  isList?: boolean;
}) => {
  const [isFollowing, setIsFollowing] = useState(following);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsFollowing(following);
  }, [following]);

  const handleFollow = async () => {
    try {
      setLoading(true);

      const res = await axios.post("/api/follow", { followId: user.id });

      if (res.data.success === "followed") {
        setIsFollowing(true);
        //send a notification
      } else if (res.data.success === "unfollowed") {
        setIsFollowing(false);
      }

      router.refresh();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Something went wrong!";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      outlined
      label={loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
      onClick={handleFollow}
      disabled={loading}
      small={isList}
      className="cursor-pointer"
    />
  );
};

export default FollowButton;
