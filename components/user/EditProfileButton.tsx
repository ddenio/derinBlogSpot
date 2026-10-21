import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { User } from "@/generated/prisma/client";

const EditProfileButton = ({ user }: { user: Pick<User, "id"> }) => {
  return (
    <Link
      className={buttonVariants({ variant: "outline", size: "sm" })}
      href={`/user/edit/${user.id}`}
    >
      <Pencil />
      Edit Profile
    </Link>
  );
};

export default EditProfileButton;
