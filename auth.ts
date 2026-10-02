import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import authConfig from "./auth.config";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { getUserByEmail } from "./lib/user";
import { LoginSchema } from "./schemas/LoginSchema";
import bcrypt from "bcryptjs";

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
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);

        if (!user || !user.password) return null;

        const isCorrectPassword = await bcrypt.compare(password, user.password);

        if (isCorrectPassword) return user;
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      if (!token.email) return token;

      const user = await getUserByEmail(token.email);

      if (!user) return token;

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
