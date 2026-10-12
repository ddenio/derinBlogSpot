"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Heading from "../common/Heading";
import FormField from "../common/FormField";
import Button from "../common/Button";
import { toast } from "react-hot-toast";

import { useRouter, useSearchParams } from "next/navigation";
import {
  PasswordResetSchema,
  PasswordResetSchemaType,
} from "@/schemas/PasswordResetSchema";
import { passwordReset } from "@/actions/auth/password-reset";

const PasswordResetFormClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema),
  });

  const token = searchParams.get("token");

  const onSubmit: SubmitHandler<PasswordResetSchemaType> = (data) => {
    startTransition(async () => {
      try {
        const res = await passwordReset(data, token);
        if (res?.error) {
          toast.error(res.error);
        }
        if (res?.success) {
          toast.success(res.success);
          setTimeout(() => router.push("/login"), 2000);
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
      <Heading title="Enter your new DerinSpot.blog password" lg center />
      <FormField
        id="password"
        register={register}
        errors={errors}
        placeholder="password"
        type="password"
        disabled={isPending}
      />
      <FormField
        id="confirmPassword"
        register={register}
        errors={errors}
        placeholder="confirm password"
        type="password"
        disabled={isPending}
      />

      <Button
        type="submit"
        label={isPending ? "Submitting..." : "Save New Password"}
        disabled={isPending}
      />
    </form>
  );
};

export default PasswordResetFormClient;
