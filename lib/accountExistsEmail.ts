import { Resend } from "resend";
import { renderEmail } from "./emailTemplate";

// Sent when someone tries to register with an address that already has an
// account. The sign-up form shows the same message either way, so the only
// way to learn the account exists is to own the inbox.
export const sendAccountExistsEmail = async (email: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const loginLink = `${process.env.BASE_URL}/login`;

  const res = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "You already have a DerinSpot.BLOG account",
    html: renderEmail({
      heading: "You already have an account",
      body: "Someone (hopefully you) tried to create a DerinSpot.BLOG account with this email address. You already have one, so you can simply log in. If you've forgotten your password, use the \"Forgot password\" link on the login page.",
      buttonLabel: "Go to Login",
      link: loginLink,
      footnote:
        "If this wasn't you, you can safely ignore this email. Your account and password haven't changed.",
    }),
  });

  if (res.error) {
    console.error("Resend error (account exists):", res.error);
  }

  return { error: res.error };
};
