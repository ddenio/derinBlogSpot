"use server";

import bcrypt from "bcryptjs";

import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/user";

export const signUp = async (values: RegisterSchemaType) => {
  const validateFields = RegisterSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, password } = validateFields.data;

  const user = await getUserByEmail(email);

  if (user) {
    return { error: "Email already in use!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: "User Created!" };
};
