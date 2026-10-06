"use client";

import { BlogSchema, BlogSchemaType } from "@/schemas/BlogSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";

import { useForm } from "react-hook-form";
import FormField from "../common/FormField";
import AddCover from "./AddCover";
import { useState } from "react";
import dynamic from "next/dynamic";
import CoverImage from "./CoverImage";
import { tags } from "@/lib/tags";

const BlockNoteEditor = dynamic(() => import("./editor/BlockNoteEditor"), {
  ssr: false,
});

const CreateBlogForm = () => {
  const session = useSession();
  const userId = session.data?.user.userId;
  const [uploadedCover, setUploadedCover] = useState<string>();
  const [content, setContent] = useState<string | undefined>();

  console.log(uploadedCover);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BlogSchemaType>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      userId,
      isPublished: false,
    },
  });

  const onChange = (content: string) => {
    setContent(content);
  };

  return (
    <form className="flex flex-col justify-between max-w-300 m-auto min-h-[85vh]">
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
        </fieldset>
        <BlockNoteEditor onChange={onChange} />
      </div>
    </form>
  );
};

export default CreateBlogForm;
