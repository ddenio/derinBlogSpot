"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  generateEmailVerificationToken,
  sendEmailVerificationToken,
} from "@/lib/emailVerification";
import { sendEmailChangeNotice } from "@/lib/emailChangeNotice";
import { HOUR, rateLimit, tooManyMessage } from "@/lib/rateLimit";
import { getUserByEmail, getUserById } from "@/lib/user";
import {
  EditProfileSchema,
  EditProfileSchemaType,
} from "@/schemas/EditProfileSchema";
import { after } from "next/server";

export const editUser = async (
  values: EditProfileSchemaType,
  userId: string,
) => {
  const vFields = EditProfileSchema.safeParse(values);

  if (!vFields.success) return { error: "Invalid Fields" };

  const session = await auth();

  if (session?.user.userId !== userId) return { error: "Not authorized!" };

  const user = await getUserById(userId);

  if (!user) return { error: "User does not exist!" };

  // The email is handled separately below; everything else saves right away
  const { email: newEmail, ...profile } = vFields.data;

  const isEmailChange = user.email.toLowerCase() !== newEmail.toLowerCase();

  if (!isEmailChange) {
    await db.user.update({
      where: { id: userId },
      data: profile,
    });

    return { success: "User Profile Updated!" };
  }

  // Accounts that sign in with Google/GitHub get their email from there
  const oauthAccount = await db.account.findFirst({ where: { userId } });

  if (oauthAccount) {
    return {
      error:
        "Your email can't be changed here because you sign in with Google or GitHub.",
    };
  }

  const byUser = rateLimit(`email-change:user:${userId}`, 3, HOUR);

  if (!byUser.ok) return { error: tooManyMessage(byUser.retryAfterSec) };

  const existingUser = await getUserByEmail(newEmail);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  await db.user.update({
    where: { id: userId },
    data: profile,
  });

  // The account keeps its current, verified email until the link sent to the
  // NEW address is clicked. That way nobody can park an address they don't
  // own on their account, and a typo can't lock you out of your own account.
  const token = await generateEmailVerificationToken(newEmail, userId);
  const { error } = await sendEmailVerificationToken(
    token.email,
    token.token,
    "change",
  );

  if (error) {
    return {
      error:
        "Your profile was saved, but we couldn't send the confirmation email to the new address. Please try again in a moment.",
    };
  }

  // Tell the CURRENT address too, so a hijacked session can't quietly redirect
  // the account without the real owner finding out.
  const currentEmail = user.email;

  after(async () => {
    try {
      await sendEmailChangeNotice(currentEmail, newEmail);
    } catch (error) {
      console.error("Email change notice failed:", error);
    }
  });

  return {
    success: `Profile saved. We sent a confirmation link to ${newEmail}. Your email won't change until you click it.`,
  };
};
