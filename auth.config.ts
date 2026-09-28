import type { NextAuthConfig } from "next-auth";

// Keep this file Edge-runtime safe (no Prisma/bcrypt imports) — it is
// imported directly by middleware.ts. The Credentials provider (which needs
// DB access) lives in auth.ts instead, which only runs in the Node runtime.
export default {
  providers: [],
} satisfies NextAuthConfig;
