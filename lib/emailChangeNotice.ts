import { Resend } from "resend";
import { renderEmail } from "./emailTemplate";

// "j***@gmail.com": enough for the owner to recognise it, not enough to leak
// the full address to someone reading over a shoulder.
const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");

  return `${name.slice(0, 1)}***@${domain}`;
};

// Sent to the CURRENT address when someone asks to change it. If the request
// wasn't made by the account owner, this is how they find out in time.
export const sendEmailChangeNotice = async (
  currentEmail: string,
  newEmail: string,
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetLink = `${process.env.BASE_URL}/password-email-form`;

  const res = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: currentEmail,
    subject: "A change to your DerinSpot.BLOG email was requested",
    html: renderEmail({
      heading: "Email change requested",
      body: `A request was made to change the email address on your DerinSpot.BLOG account to ${maskEmail(newEmail)}. Nothing changes unless that new address is confirmed. If this was you, there's nothing to do. If it wasn't, reset your password now so nobody else can use your account.`,
      buttonLabel: "Reset My Password",
      link: resetLink,
      footnote:
        "You're getting this because it's the email address on your account.",
    }),
  });

  if (res.error) {
    console.error("Resend error (email change notice):", res.error);
  }

  return { error: res.error };
};
