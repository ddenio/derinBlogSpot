"use server";

import {
  generatePasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/passwordResetToken";
import { getUserByEmail } from "@/lib/user";
import {
  HOUR,
  MINUTE,
  ipFromHeaders,
  rateLimit,
  tooManyMessage,
} from "@/lib/rateLimit";
import { headers } from "next/headers";
import {
  PasswordEmailSchema,
  PasswordEmailSchemaType,
} from "@/schemas/PasswordEmailSchema";

export const passwordEmail = async (values: PasswordEmailSchemaType) => {
  const validatedFields = PasswordEmailSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Email!" };
  }

  const { email } = validatedFields.data;

  // Stops anyone from flooding an inbox (or your Resend quota) with reset mail
  const ip = ipFromHeaders(await headers());
  const byIp = rateLimit(`reset:ip:${ip}`, 10, HOUR);
  const byEmail = rateLimit(`reset:email:${email.toLowerCase()}`, 3, 15 * MINUTE);

  if (!byIp.ok || !byEmail.ok) {
    return {
      error: tooManyMessage(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec)),
    };
  }

  const user = await getUserByEmail(email);

  if (!user || !user.email) {
    return { error: "User not found!" };
  }

  const passwordResetToken = await generatePasswordResetToken(email);

  const { error } = await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token,
  );

  if (error) {
    return {
      error: "Something went wrong while sending password reset email!",
    };
  }

  return { success: "Password reset link was sent to your email!" };
};
