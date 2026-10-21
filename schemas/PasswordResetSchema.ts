import "@/lib/zodBrowserConfig";
import { z } from "zod";
import { NewPasswordSchema } from "./PasswordRule";

export const PasswordResetSchema = z
  .object({
    password: NewPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(
    (values) => {
      return values.password === values.confirmPassword;
    },
    { message: "Passwords must match!", path: ["confirmPassword"] },
  );

export type PasswordResetSchemaType = z.infer<typeof PasswordResetSchema>;
