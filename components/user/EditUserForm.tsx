"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Heading from "../common/Heading";
import FormField from "../common/FormField";
import Button from "../common/Button";
import { Button as UiButton } from "../ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { toast } from "react-hot-toast";
import { User } from "@/generated/prisma/client";
import {
  EditProfileSchema,
  EditProfileSchemaType,
} from "@/schemas/EditProfileSchema";
import { editUser } from "@/actions/users/edit-user";
import { tags } from "@/lib/tags";
import { deleteUser } from "@/actions/users/delete-user";
import { signOut } from "next-auth/react";

const EditUserForm = ({
  user,
  isCredentials,
}: {
  user: Pick<User, "id" | "name" | "email" | "bio" | "tags">;
  isCredentials: boolean;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileSchemaType>({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      name: user.name || undefined,
      email: user.email || undefined,
      bio: user.bio || undefined,
      tags: user.tags || undefined,
    },
  });

  const onSubmit: SubmitHandler<EditProfileSchemaType> = (data) => {
    startTransition(async () => {
      try {
        const res = await editUser(data, user.id);
        if (res?.error) {
          toast.error(res.error);
        }
        if (res?.success) {
          toast.success(res.success);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const onDelete = () => {
    startDeleting(async () => {
      try {
        const res = await deleteUser(user.id);
        if (res?.error) {
          toast.error(res.error);
        }
        if (res?.success) {
          toast.success(res.success);
          setTimeout(() => {
            signOut({ callbackUrl: "/login" });
          }, 4000);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col max-w-125 m-auto mt-8 gap-2"
      >
        <Heading title="Edit Profile" lg />
        <FormField
          id="name"
          register={register}
          errors={errors}
          placeholder="name"
          disabled={isPending}
          label="Name"
        />
        {isCredentials && (
          <FormField
            id="email"
            register={register}
            errors={errors}
            placeholder="email"
            disabled={isPending || !isCredentials}
            label="Email"
          />
        )}
        <FormField
          id="bio"
          register={register}
          errors={errors}
          placeholder="bio"
          disabled={isPending}
          label="Bio"
        />

        <fieldset className="flex flex-col">
          <legend className="mb-3 text-sm font-medium text-muted-foreground">
            Select tags
          </legend>
          <div className="flex flex-wrap gap-4 w-full">
            {tags.map((tag) => {
              if (tag === "All") return null;

              return (
                <label key={tag} className="cursor-pointer">
                  <input
                    type="checkbox"
                    value={tag}
                    {...register("tags")}
                    className="peer sr-only"
                  />
                  <span
                    className="inline-block rounded-full border px-3 py-1 text-sm transition-colors
                hover:bg-muted
                peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary
                peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                  >
                    {tag}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <Button
          type="submit"
          label={isPending ? "Saving..." : "Save Changes"}
          disabled={isPending}
        />
      </form>
      <div className="max-w-125 m-auto mt-12">
        <div className="text-rose-500">
          <Heading title="Danger Zone" lg />
        </div>
        <UiButton
          variant="destructive"
          type="button"
          className="mt-4"
          disabled={isDeleting}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 />
          {isDeleting ? "Deleting..." : "Delete Account"}
        </UiButton>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all of your
                data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
              >
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default EditUserForm;
