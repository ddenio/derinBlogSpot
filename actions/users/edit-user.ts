"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import {
  EditProfileSchema,
  EditProfileSchemaType,
} from "@/schemas/EditProfileSchema";

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

  await db.user.update({
    where: { id: userId },
    data: {
      ...vFields.data,
    },
  });

  return { success: "User Profile Updated!" };
};
