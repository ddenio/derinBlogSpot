"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/user";

export const verifyEmail = async (token: string) => {
  const emailVerificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!emailVerificationToken)
    return { error: "Verification token does not exist!" };

  const isExpired = new Date(emailVerificationToken.expires) < new Date();

  if (isExpired) return { error: "Verification token expired!" };

  // "Change my email" token: switch the account over only now, after the
  // owner of the NEW inbox has clicked the link.
  if (emailVerificationToken.userId) {
    const requester = await db.user.findUnique({
      where: { id: emailVerificationToken.userId },
      select: { id: true },
    });

    if (!requester) return { error: "User does not exist!" };

    const takenBy = await getUserByEmail(emailVerificationToken.email);

    if (takenBy && takenBy.id !== requester.id) {
      return { error: "That email address is already in use by another account." };
    }

    try {
      await db.user.update({
        where: { id: requester.id },
        data: { email: emailVerificationToken.email, emailVerified: new Date() },
      });
    } catch {
      return { error: "Couldn't update your email. Please try again." };
    }

    // One use only, so an old link can't switch the address back later
    await db.emailVerificationToken
      .delete({ where: { id: emailVerificationToken.id } })
      .catch(() => {});

    return { success: "Your new email address is confirmed!" };
  }

  const existingUser = await getUserByEmail(emailVerificationToken.email);

  if (!existingUser) return { error: "User does not exist!" };

  await db.user.update({
    where: { id: existingUser.id },
    data: { emailVerified: new Date(), email: emailVerificationToken.email },
  });

  return { success: "Email verified!" };
};
