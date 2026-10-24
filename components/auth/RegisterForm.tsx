"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../common/FormField";

import Heading from "../common/Heading";
import Button from "../common/Button";
import SocialAuth from "./SocialAuth";
import LegalConsentNote from "../legal/LegalConsentNote";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { signUp } from "@/actions/auth/register";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const RegisterForm = () => {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit: SubmitHandler<RegisterSchemaType> = (data) => {
    startTransition(async () => {
      try {
        const res = await signUp(data);

        if (res.error) {
          toast.error(res.error);
          return;
        }

        if (res.success) {
          toast.success(res.success);
          setSuccess(true);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  if (success) {
    return (
      <div className="flex flex-col max-w-125 m-auto mt-8 gap-2 text-center">
        <Heading title="Check Your Email" lg center />
        <p className="text-muted-foreground">
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

      <p className="-mt-1 text-xs text-muted-foreground">
        Use at least 10 characters. A few random words strung together make a
        strong password that&apos;s easy to remember.
      </p>

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
        label={isPending ? "Submitting..." : "Register"}
        disabled={isPending}
      />
      <div className="flex justify-center my-2">Or</div>
      <SocialAuth />
      <LegalConsentNote />
    </form>
  );
};

export default RegisterForm;
