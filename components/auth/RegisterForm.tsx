"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../common/FormField";

import Heading from "../common/Heading";
import Button from "../common/Button";
import SocialAuth from "./SocialAuth";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { signUp } from "@/actions/auth/register";
import { useState, useTransition } from "react";
import Alert from "../common/Alert";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit: SubmitHandler<RegisterSchemaType> = (data) => {
    setSuccess("");
    setError("");
    startTransition(async () => {
      const res = await signUp(data);
      setError(res.error);
      setSuccess(res.success);
    });
  };

  if (success) {
    return (
      <div className="flex flex-col max-w-125 m-auto mt-8 gap-2 text-center">
        <Heading title="Check Your Email" lg center />
        <Alert message={success} success />
        <p className="text-slate-600 dark:text-slate-300">
          We sent a verification link to your email address. Click the link
          to verify your account, then log in below.
        </p>
        <Button
          type="button"
          label="Back to Login"
          onClick={() => router.push("/login")}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col max-w-125 m-auto mt-8 gap-2"
    >
      <Heading title="Create a DerinSpot.blog Account" lg center />
      <FormField
        id="name"
        register={register}
        errors={errors}
        placeholder="name"
        disabled={isPending}
      />

      <FormField
        id="email"
        register={register}
        errors={errors}
        placeholder="email"
        disabled={isPending}
      />

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
      {error && <Alert message={error} error />}
      {success && <Alert message={success} success />}
      <Button
        type="submit"
        label={isPending ? "Submitting..." : "Register"}
        disabled={isPending}
      />
      <div className="flex justify-center my-2">Or</div>
      <SocialAuth />
    </form>
  );
};

export default RegisterForm;
