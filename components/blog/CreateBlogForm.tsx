"use client";

import { BlogSchema, BlogSchemaType } from "@/schemas/BlogSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";

import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../common/FormField";
import AddCover from "./AddCover";
import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import CoverImage from "./CoverImage";
import { tags } from "@/lib/tags";
import Button from "../common/Button";
import Alert from "../common/Alert";
import { createBlog } from "@/actions/blogs/create-blog";
import { Blog } from "@/generated/prisma/client";
import { editBlog } from "@/actions/blogs/edit-blog";

const BlockNoteEditor = dynamic(() => import("./editor/BlockNoteEditor"), {
  ssr: false,
});

const CreateBlogForm = ({ blog }: { blog?: Blog }) => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [uploadedCover, setUploadedCover] = useState<string>();
  const [content, setContent] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPublishing, startPublishing] = useTransition();
  const [isSavingAsDraft, startSavingAsDraft] = useTransition();

  console.log(uploadedCover);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BlogSchemaType>({
    resolver: zodResolver(BlogSchema),
    defaultValues: blog
      ? {
          userId: blog.userId,
          isPublished: blog.isPublished,
          title: blog.title,
          content: blog.content,
          coverImage: blog.coverImage || undefined,
          tags: blog.tags,
        }
      : {
          userId,
          isPublished: false,
        },
  });

  useEffect(() => {
    if (uploadedCover) {
      setValue("coverImage", uploadedCover, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [uploadedCover, setValue]);

  useEffect(() => {
    if (typeof content === "string") {
      setValue("content", content, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [content, setValue]);

  useEffect(() => {
    if (blog?.coverImage) {
      setUploadedCover(blog.coverImage);
    }
  }, [blog?.coverImage]);

  const onChange = (content: string) => {
    setContent(content);
  };

  const onSaveDraft: SubmitHandler<BlogSchemaType> = (data) => {
    setSuccess("");
    setError("");

    startSavingAsDraft(async () => {
      if (blog) {
        try {
          const res = await editBlog({ ...data, isPublished: false }, blog.id);

          if (res.error) setError(res.error);
          if (res.success) setSuccess(res.success);
        } catch {
          setError("Something went wrong. Please try again.");
        }
      } else {
        try {
          const res = await createBlog({ ...data, isPublished: false });

          if (res.error) setError(res.error);
          if (res.success) setSuccess(res.success);
        } catch {
          setError("Something went wrong. Please try again.");
        }
      }
    });
  };

  const onPublish: SubmitHandler<BlogSchemaType> = (data) => {
    setSuccess("");
    setError("");

    if (data.tags.length > 4) {
      return setError("Select a max of 4 tags!");
    }

    startPublishing(async () => {
      if (blog) {
        try {
          const res = await editBlog({ ...data, isPublished: true }, blog.id);

          if (res.error) setError(res.error);
          if (res.success) setSuccess(res.success);
        } catch {
          setError("Something went wrong. Please try again.");
        }
      } else {
        try {
          const res = await createBlog({ ...data, isPublished: true });

          if (res.error) setError(res.error);
          if (res.success) setSuccess(res.success);
        } catch {
          setError("Something went wrong. Please try again.");
        }
      }
    });
  };

  console.log("errors >>>", errors);

  return (
    <form
      onSubmit={handleSubmit(onPublish)}
      className="flex flex-col justify-between max-w-300 m-auto min-h-[85vh]"
    >
      <div className="mt-8 flex flex-col gap-6">
        {!!uploadedCover && (
          <CoverImage
            url={uploadedCover}
            isEditor={true}
            setUploadedCover={setUploadedCover}
          />
        )}
        {!uploadedCover && (
          <AddCover setUploadedCover={setUploadedCover} variant="standalone" />
        )}

        <FormField
          id="title"
          register={register}
          errors={errors}
          placeholder="Blog Title"
          disabled={false}
          inputClassNames="border-none text-5xl font-bold bg-transparent px-0"
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-muted-foreground">
            Select up to 4 tags
          </legend>
          <div className="flex flex-wrap gap-2">
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
          {errors.tags && errors.tags.message && (
            <span className="text-sm text-rose-400">
              Select at least one tag, max of 4!
            </span>
          )}
        </fieldset>
        <BlockNoteEditor
          onChange={onChange}
          initialContent={blog?.content ? blog.content : ""}
        />
        {errors.content && errors.content.message && (
          <span className="text-sm text-rose-400">
            {errors.content.message}
          </span>
        )}
      </div>
      <div>
        <div className="border-t pt-2">
          {errors.userId && errors.userId.message && (
            <span className="text-sm text-rose-400">Missing a User Id</span>
          )}
          {success && <Alert message={success} success />}
          {error && <Alert message={error} error />}
          <div className="flex items-center justify-between gap-6">
            <div className="flex gap-4">
              <Button
                type="submit"
                label={isPublishing ? "Publishing..." : "Publish"}
                className="bg-blue-700"
              />
              <Button
                type="button"
                label={isSavingAsDraft ? "Saving..." : "Save as Draft"}
                onClick={handleSubmit(onSaveDraft)}
              />
            </div>
            <div>
              <Button type="button" label="Delete" className="bg-rose-400" />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateBlogForm;
