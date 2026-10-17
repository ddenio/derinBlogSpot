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

export const generateEmailVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.emailVerificationToken.delete({
      where: { id: existingToken.id },
    });
  }

  const emailVerificationToken = await db.emailVerificationToken.create({
    data: { email, token, expires },
  });

  return emailVerificationToken;
};

export const sendEmailVerificationToken = async (
  email: string,
  token: string,
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const emailVerificationLink = `${process.env.BASE_URL}/email-verification?token=${token}`;

  const res = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "DerinSpot.BLOG Email Verification",
    html: renderEmail({
      heading: "Verify your email",
      body: "Welcome to DerinSpot.BLOG! Confirm your email address to activate your account and start reading and writing.",
      buttonLabel: "Verify Email",
      link: emailVerificationLink,
      footnote:
        "This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.",
    }),
  });

  if (res.error) {
    console.error("Resend error:", res.error);
  }

  return { error: res.error };
};
