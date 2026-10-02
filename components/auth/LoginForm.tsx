"use client";

import { LoginSchema, LoginSchemaType } from "@/schemas/LoginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../common/FormField";

import Heading from "../common/Heading";
import Button from "../common/Button";
import SocialAuth from "./SocialAuth";
import { useState, useTransition } from "react";
import { login } from "@/actions/auth/login";
import Alert from "../common/Alert";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LOGIN_REDIRECT } from "@/routes";
import Link from "next/link";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({ resolver: zodResolver(LoginSchema) });

  const router = useRouter();
  const { update } = useSession();

  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email address already in use!"
      : "";

  const onSubmit: SubmitHandler<LoginSchemaType> = (data) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await login(data);
        if (res?.error) {
          router.replace("/login");
          setError(res.error);
        }

        if (res?.success) {
          setSuccess(res.success);
          await update();
          setTimeout(() => router.push(LOGIN_REDIRECT), 1000);
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col max-w-125 m-auto mt-8 gap-2"
    >
      <Heading title="Login to DerinSpot.blog" lg center />
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
      {error && <Alert message={error} error />}
      {success && <Alert message={success} success />}

      <Button
        type="submit"
        label={isPending ? "Submitting..." : "Login"}
        disabled={isPending}
      />
      <div className="flex justify-center my-2">Or</div>
      <SocialAuth />
      {urlError && <Alert message={urlError} error />}
      <div className="flex items-end justify-end">
        <Link
          className="mt-2 text-sm underline text-slate-700 dark:text-slate-300"
          href="/password-email-form"
        >
          Forgot Password?
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
