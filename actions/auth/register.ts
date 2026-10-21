"use server";

import bcrypt from "bcryptjs";

import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/user";
import {
  HOUR,
  ipFromHeaders,
  rateLimit,
  tooManyMessage,
} from "@/lib/rateLimit";
import { headers } from "next/headers";
import {
  generateEmailVerificationToken,
  sendEmailVerificationToken,
} from "@/lib/emailVerification";

export const signUp = async (values: RegisterSchemaType) => {
  const validateFields = RegisterSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, password } = validateFields.data;

  // Each sign-up sends an email, so limit how many one person/address can start
  const ip = ipFromHeaders(await headers());
  const byIp = rateLimit(`register:ip:${ip}`, 5, HOUR);
  const byEmail = rateLimit(`register:email:${email.toLowerCase()}`, 3, HOUR);

  if (!byIp.ok || !byEmail.ok) {
    return {
      error: tooManyMessage(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec)),
    };
  }

  const user = await getUserByEmail(email);

  if (user) {
    return { error: "Email already in use!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const emailVerificationToken = await generateEmailVerificationToken(email);
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

  return { success: "Verification email sent, (Check Spam Folder!)" };
};
