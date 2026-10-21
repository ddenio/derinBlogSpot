import { db } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";
import { renderEmail } from "./emailTemplate";

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.emailVerificationToken.findFirst({
      where: { email },
    });

    return verificationToken;
  } catch {
    return null;
  }
};

export const generateEmailVerificationToken = async (
  email: string,
  userId?: string,
) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.emailVerificationToken.delete({
      where: { id: existingToken.id },
    });
  }

  const emailVerificationToken = await db.emailVerificationToken.create({
    data: { email, token, expires, userId: userId ?? null },
  });

  return emailVerificationToken;
};

export const sendEmailVerificationToken = async (
  email: string,
  token: string,
  kind: "signup" | "change" = "signup",
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const emailVerificationLink = `${process.env.BASE_URL}/email-verification?token=${token}`;

  const res = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject:
      kind === "change"
        ? "Confirm your new DerinSpot.BLOG email address"
        : "DerinSpot.BLOG Email Verification",
    html: renderEmail(
      kind === "change"
        ? {
            heading: "Confirm your new email",
            body: "Someone asked to use this email address for a DerinSpot.BLOG account. Confirm it to switch your account over to this address.",
            buttonLabel: "Confirm New Email",
            link: emailVerificationLink,
            footnote:
              "This link expires in 1 hour. If you didn't ask for this, you can safely ignore this email and nothing will change.",
          }
        : {
            heading: "Verify your email",
            body: "Welcome to DerinSpot.BLOG! Confirm your email address to activate your account and start reading and writing.",
            buttonLabel: "Verify Email",
            link: emailVerificationLink,
            footnote:
              "This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.",
          },
    ),
  });

  if (res.error) {
    console.error("Resend error:", res.error);
  }

  return { error: res.error };
};
