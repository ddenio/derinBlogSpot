"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Heading from "../common/Heading";
import FormField from "../common/FormField";
import Button from "../common/Button";

import { toast } from "react-hot-toast";
import { User } from "@/generated/prisma/client";
import {
  EditProfileSchema,
  EditProfileSchemaType,
} from "@/schemas/EditProfileSchema";
import { editUser } from "@/actions/users/edit-user";
import { tags } from "@/lib/tags";

const EditUserForm = ({
  user,
  isCredentials,
}: {
  user: User;
  isCredentials: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileSchemaType>({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      name: user.name || undefined,
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

  return (
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
  );
};

export default EditUserForm;
