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
import { after } from "next/server";
import {
  generateEmailVerificationToken,
  sendEmailVerificationToken,
} from "@/lib/emailVerification";
import { sendAccountExistsEmail } from "@/lib/accountExistsEmail";

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
      error: tooManyMessage(
        Math.max(byIp.retryAfterSec, byEmail.retryAfterSec),
      ),
    };
  }

  // Hash for every request (not only new accounts) so a taken email doesn't
  // answer measurably faster than a free one.
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await getUserByEmail(email);

  if (user) {
    // Don't reveal that the account exists. Tell the real owner by email
    // instead, and answer the form exactly as for a brand new sign-up.
    const existingEmail = user.email;
    const isVerified = !!user.emailVerified;

    after(async () => {
      try {
        if (isVerified) {
          await sendAccountExistsEmail(existingEmail);
        } else {
          // Still unverified: just send the verification link again
          const token = await generateEmailVerificationToken(existingEmail);
          await sendEmailVerificationToken(token.email, token.token);
        }
      } catch (error) {
        console.error("Register (existing account) email failed:", error);
      }
    });
  } else {
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Sent after the response so both paths take about the same time. If it
    // fails, the user can log in to have the verification email re-sent.
    after(async () => {
      try {
        const token = await generateEmailVerificationToken(email);
        const { error } = await sendEmailVerificationToken(
          token.email,
          token.token,
        );

        if (error) console.error("Verification email failed:", error);
      } catch (error) {
        console.error("Verification email failed:", error);
      }
    });
  }

  return {
    success:
      "Check your email to finish creating your account. (Check Spam Folder!)",
  };
};
