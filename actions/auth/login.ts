"use server";

import { signIn } from "@/auth";
import {
  generateEmailVerificationToken,
  sendEmailVerificationToken,
} from "@/lib/emailVerification";
import {
  HOUR,
  MINUTE,
  ipFromHeaders,
  rateLimit,
  resetRateLimit,
  tooManyMessage,
} from "@/lib/rateLimit";
import { getUserByEmail } from "@/lib/user";
import { LoginSchema, LoginSchemaType } from "@/schemas/LoginSchema";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";

// Compared against when the email doesn't exist, so a missing account takes
// about as long to reject as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const login = async (values: LoginSchemaType) => {
  const validateFields = LoginSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validateFields.data;

  const ip = ipFromHeaders(await headers());
  const emailKey = `login:email:${email.toLowerCase()}`;

  const byIp = rateLimit(`login:ip:${ip}`, 20, 15 * MINUTE);
  const byEmail = rateLimit(emailKey, 5, 15 * MINUTE);

  if (!byIp.ok || !byEmail.ok) {
    return {
      error: tooManyMessage(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec)),
    };
  }

  const user = await getUserByEmail(email);

  // Check the password BEFORE doing anything that sends email, so nobody can
  // trigger emails to an address just by typing it into the login form.
  const isCorrectPassword = await bcrypt.compare(
    password,
    user?.password ?? DUMMY_HASH,
  );

  if (!user || !user.password || !isCorrectPassword) {
    return { error: "Invalid Credentials" };
  }

  if (!user.emailVerified) {
    const byVerify = rateLimit(
      `verify:email:${email.toLowerCase()}`,
      3,
      HOUR,
    );

    if (!byVerify.ok) {
      return {
        error:
          "A verification email was sent recently. Check your inbox (and spam folder), or try again later.",
      };
    }

    const emailVerificationToken = await generateEmailVerificationToken(
      user.email,
    );
    const { error } = await sendEmailVerificationToken(
      emailVerificationToken.email,
      emailVerificationToken.token,
    );

    if (error) {
      return {
        error:
          "Something went wrong while sending verification email! Try to login to resend the verification email!",
      };
    }

    return {
      success: "Verification email sent! (Check Spam Folder!)",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }

  resetRateLimit(emailKey);

  return { success: "Logged in successfully!" };
};
