import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

// Build providers array — only include OAuth providers if env vars are set
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      if (!user.isActive || user.isBanned) {
        return null;
      }

      const isPasswordValid = await bcryptjs.compare(credentials.password, user.passwordHash);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role as Role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      };
    },
  }),
];

// Conditionally add Google provider
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Conditionally add Facebook provider
if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, implement same-email auto-linking
      if (account && account.provider !== "credentials") {
        const email = user.email;
        if (!email) return true;

        // Check if a user with this email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if this OAuth account is already linked
          const alreadyLinked = existingUser.accounts.some(
            (acc) =>
              acc.provider === account.provider &&
              acc.providerAccountId === account.providerAccountId,
          );

          if (!alreadyLinked) {
            // Link the OAuth account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          // Override user id so NextAuth uses the existing user
          user.id = existingUser.id;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in, user object is available — fetch full data and attach to token
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.emailVerified = (user as { emailVerified: boolean }).emailVerified;
        token.phoneVerified = (user as { phoneVerified: boolean }).phoneVerified;
      }

      // On session update or subsequent requests, refresh user data from DB
      if (trigger === "update" || (!user && token.id)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            role: true,
            emailVerified: true,
            phoneVerified: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as Role;
          token.emailVerified = dbUser.emailVerified;
          token.phoneVerified = dbUser.phoneVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Copy fields from JWT token to the session object
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.phoneVerified = token.phoneVerified as boolean;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  secret: env.NEXTAUTH_SECRET,
};
