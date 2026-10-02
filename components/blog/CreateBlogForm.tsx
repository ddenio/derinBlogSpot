"use client";

import { BlogSchema, BlogSchemaType } from "@/schemas/BlogSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { format } from "path";
import { useForm } from "react-hook-form";
import FormField from "../common/FormField";

const CreateBlogForm = () => {
  const session = useSession();
  const userId = session.data.user.userId;

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
  return (
    <form className="flex flex-col justify-between max-w-300 m-auto min-h-[85vh]">
      <div>
        <FormField
          id="title"
          register={register}
          errors={errors}
          placeholder="Blog Title"
          disabled={false}
          inputClassNames="border-none text-5xl font-bold bg-transparent px-0"
        />
      </div>
    </form>
  );
};

export default CreateBlogForm;
