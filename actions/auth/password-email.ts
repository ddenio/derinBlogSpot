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
import {
  PasswordEmailSchema,
  PasswordEmailSchemaType,
} from "@/schemas/PasswordEmailSchema";
import { headers } from "next/headers";
import { after } from "next/server";

export const passwordEmail = async (values: PasswordEmailSchemaType) => {
  const validatedFields = PasswordEmailSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Email!" };
  }

  const { email } = validatedFields.data;

  // Stops anyone from flooding an inbox (or your Resend quota) with reset mail
  const ip = ipFromHeaders(await headers());
  const byIp = rateLimit(`reset:ip:${ip}`, 10, HOUR);
  const byEmail = rateLimit(
    `reset:email:${email.toLowerCase()}`,
    3,
    15 * MINUTE,
  );

  if (!byIp.ok || !byEmail.ok) {
    return {
      error: tooManyMessage(
        Math.max(byIp.retryAfterSec, byEmail.retryAfterSec),
      ),
    };
  }

  const user = await getUserByEmail(email);

  // Same response whether or not the account exists, so this form can't be
  // used to find out who has an account. The work happens after the response
  // is sent, so response time doesn't give it away either.
  if (user?.email) {
    const userEmail = user.email;

    after(async () => {
      try {
        const passwordResetToken = await generatePasswordResetToken(userEmail);
        const { error } = await sendPasswordResetEmail(
          passwordResetToken.email,
          passwordResetToken.token,
        );

        if (error) console.error("Password reset email failed:", error);
      } catch (error) {
        console.error("Password reset email failed:", error);
      }
    });
  }

  return {
    success:
      "If an account exists for that email, a password reset link is on its way. (Check your spam folder!)",
  };
};
