import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import authConfig from "./auth.config";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { getUserByEmail, getUserById } from "./lib/user";
import { LoginSchema } from "./schemas/LoginSchema";
import bcrypt from "bcryptjs";
import {
  MINUTE,
  ipFromHeaders,
  rateLimit,
  resetRateLimit,
} from "./lib/rateLimit";

declare module "next-auth" {
  interface Session {
    user: {
      role: "USER" | "ADMIN";
      userId: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  providers: [
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials, request) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // This is the real login gate: anyone can POST straight to Auth.js and
        // skip the login server action, so throttle here as well.
        const emailKey = `auth:email:${email.toLowerCase()}`;
        const byEmail = rateLimit(emailKey, 10, 15 * MINUTE);
        const byIp = rateLimit(
          `auth:ip:${ipFromHeaders(request.headers)}`,
          50,
          15 * MINUTE,
        );

        if (!byEmail.ok || !byIp.ok) return null;

        const user = await getUserByEmail(email);

        if (!user || !user.password) return null;

        const isCorrectPassword = await bcrypt.compare(password, user.password);

        if (!isCorrectPassword) return null;

        // Unverified accounts must verify their email first, even when the
        // login server action is bypassed.
        if (!user.emailVerified) return null;

        resetRateLimit(emailKey);

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      // Look the user up by id once we have it: the email can change (after a
      // confirmed email change), but the id never does.
      const user = token.userId
        ? await getUserById(token.userId as string)
        : token.email
          ? await getUserByEmail(token.email)
          : null;

      if (!user) return token;

      token.email = user.email;
      token.role = user.role;
      token.userId = user.id;

      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as "USER" | "ADMIN";
      }
      if (token.userId) {
        session.user.userId = token.userId as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
