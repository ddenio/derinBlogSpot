import { z } from "zod";

export const CommentSchema = z.object({
  content: z
    .string()
    .min(4, { message: "Comment is too short" })
    .max(500, { message: "Your comment is too long, 500 characters max!" }),
});
export type CommentSchemaType = z.infer<typeof CommentSchema>;
