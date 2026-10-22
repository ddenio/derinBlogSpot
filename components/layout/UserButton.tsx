"use client";

import { LogOut, Pencil, Shield, User, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FaRegBookmark } from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const UserButton = () => {
  const session = useSession();
  const isAdmin = session.data?.user.role === "ADMIN";
  const imageUrl = session.data?.user.image || "";
  const router = useRouter();

  // redirect: false keeps the page alive so the toast isn't lost to a full reload
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <Avatar>
          <AvatarImage src={imageUrl} />
          <AvatarFallback className="border-2 border-slate-500 dark: border-slate-50">
            <UserRound />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <button
            onClick={() => router.push(`/user/${session.data?.user.userId}/1`)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <User size={18} /> Profile
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            onClick={() => router.push("/blog/create")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Pencil size={18} /> Create Post
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            onClick={() => router.push("/blog/bookmarks/1")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FaRegBookmark size={16} /> Bookmarks
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem>
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Shield size={18} /> Admin
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
