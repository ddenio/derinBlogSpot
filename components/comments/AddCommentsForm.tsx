"use client";

import { CommentSchema, CommentSchemaType } from "@/schemas/CommentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Button from "../common/Button";
import TextAreaField from "../common/TextAreaField";
import { addComment } from "@/actions/comments/add-comment";
import { toast } from "react-hot-toast";
import { createNotification } from "@/actions/notifications/createNotification";

interface IAddCommentsProps {
  blogId: string;
  userId: string;
  parentId?: string;
  repliedToId?: string;
  placeholder?: string;
  creatorId?: string;
  onSuccess?: () => void;
}

const AddCommentsForm = ({
  blogId,
  userId,
  parentId,
  repliedToId,
  placeholder,
  creatorId,
  onSuccess,
}: IAddCommentsProps) => {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentSchemaType>({
    resolver: zodResolver(CommentSchema),
  });

  const onSubmit: SubmitHandler<CommentSchemaType> = (data) => {
    startTransition(async () => {
      try {
        const res = await addComment({
          values: data,
          userId,
          blogId,
          parentId,
          repliedToUserId: repliedToId,
        });

        if (res.error) {
          toast.error(res.error);
          return;
        }

        if (res.success) {
          if (repliedToId) {
            await createNotification({
              recipientId: repliedToId,
              type: "COMMENT_REPLY",
              commentId: parentId,
              entityType: "COMMENT",
              content: data.content,
            });

            //send notification realtime
          }

          if (creatorId) {
            await createNotification({
              recipientId: creatorId,
              type: "NEW_COMMENT",
              blogId,
              entityType: "BLOG",
              content: data.content,
            });

            //send notification realtime
          }
          toast.success(res.success);
          reset();
          onSuccess?.();
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col my-2">
      <TextAreaField
        id="content"
        register={register}
        errors={errors}
        placeholder={placeholder ? placeholder : "Add Comment"}
        disabled={isPending}
      />
      <div>
        <Button
          type="submit"
          label={isPending ? "Submitting..." : "Submit"}
          disabled={isPending}
        />
      </div>
    </form>
  );
};

export default AddCommentsForm;
