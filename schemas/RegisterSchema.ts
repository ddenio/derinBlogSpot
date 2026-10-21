import "@/lib/zodBrowserConfig";
import { z } from "zod";
import { NewPasswordSchema } from "./PasswordRule";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(4, "name must be 4 or more characters long")
      .max(30, "name must be 30 or fewer characters long"),
    email: z.string().email(),
    password: NewPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(
    (values) => {
      return values.password === values.confirmPassword;
    },
    { message: "Passwords must match!", path: ["confirmPassword"] },
  );
export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
