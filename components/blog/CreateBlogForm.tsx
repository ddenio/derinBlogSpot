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
      <div className="mt-8">
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

        <fieldset className="flex flex-col border-y mb-4 py-2">
          <legend className="mb-2 pr-2">Select up to 4 Tags</legend>
          <div className="flex gap-4 flex-wrap w-full max-h-48 overflow-y-auto pr-2">
            {tags.map((tag) => {
              if (tag === "All") return null;

              return (
                <label key={tag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={tag}
                    {...register("tags")}
                    disabled={false}
                  />
                  <span>{tag}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <BlockNoteEditor />
      </div>
    </form>
  );
};

export default CreateBlogForm;
