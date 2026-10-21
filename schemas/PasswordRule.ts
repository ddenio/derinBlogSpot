import "@/lib/zodBrowserConfig";
import { z } from "zod";

// Rule for CHOOSING a password (register + reset). Login deliberately does
// not use this, so people with older, shorter passwords can still log in.
//
// Length matters more than odd symbol rules. The 72 cap is because bcrypt
// silently ignores everything past 72 bytes.
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "passw0rd123",
  "1234567890",
  "12345678910",
  "123456789012",
  "0123456789",
  "qwertyuiop",
  "qwerty12345",
  "qwerty123456",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "abcdefghij",
  "abcd123456",
  "iloveyou123",
  "letmein1234",
  "welcome1234",
  "admin12345",
  "administrator",
  "derinspot",
  "derinspot.blog",
  "derinspot123",
]);

export const NewPasswordSchema = z
  .string()
  .min(10, { message: "password must be at least 10 characters long!" })
  .max(72, { message: "password must be 72 characters or fewer!" })
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "that password is too common, please choose a harder one!",
  })
  .refine((value) => !/^(.)\1+$/.test(value), {
    message: "password can't be one character repeated!",
  });
