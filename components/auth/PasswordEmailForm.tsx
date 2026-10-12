"use client";

import {
  PasswordEmailSchema,
  PasswordEmailSchemaType,
} from "@/schemas/PasswordEmailSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Heading from "../common/Heading";
import FormField from "../common/FormField";
import Button from "../common/Button";
import { passwordEmail } from "@/actions/auth/password-email";
import { toast } from "react-hot-toast";

const PasswordEmailForm = () => {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordEmailSchemaType>({
    resolver: zodResolver(PasswordEmailSchema),
  });

  const onSubmit: SubmitHandler<PasswordEmailSchemaType> = (data) => {
    startTransition(async () => {
      try {
        const res = await passwordEmail(data);
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
      <Heading title="Forgot your DerinSpot.blog password?" lg center />
      <FormField
        id="email"
        register={register}
        errors={errors}
        placeholder="email"
        disabled={isPending}
      />

      <Button
        type="submit"
        label={isPending ? "Submitting..." : "Send Password Reset Email"}
        disabled={isPending}
      />
    </form>
  );
};

export default PasswordEmailForm;
