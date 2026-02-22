import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { checkSuspiciousLogin, recordLogin, sendSuspiciousLoginEmail } from "@/lib/suspicious-login";
import type { Role } from "@/types";

// Lockout thresholds
const CAPTCHA_THRESHOLD = 3; // After 3 failures, require CAPTCHA
const LOCKOUT_THRESHOLD = 8; // After 8 total failures (3 + 5 with CAPTCHA), lock account
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Build providers array — only include OAuth providers if env vars are set
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      captchaAnswer: { label: "CAPTCHA Answer", type: "text" },
      captchaExpected: { label: "CAPTCHA Expected", type: "text" },
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
          failedLoginAttempts: true,
          lockedUntil: true,
          twoFactorEnabled: true,
          twoFactorMethod: true,
          phone: true,
        },
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      if (!user.isActive || user.isBanned) {
        return null;
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new Error(`LOCKED:${minutesLeft}`);
      }

      // Reset lock if lockout period has expired
      if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }

      // Check CAPTCHA requirement (after 3 failed attempts)
      if (user.failedLoginAttempts >= CAPTCHA_THRESHOLD) {
        const captchaAnswer = credentials.captchaAnswer?.trim();
        const captchaExpected = credentials.captchaExpected?.trim();

        if (!captchaAnswer || !captchaExpected || captchaAnswer !== captchaExpected) {
          throw new Error("CAPTCHA_REQUIRED");
        }
      }

      const isPasswordValid = await bcryptjs.compare(credentials.password, user.passwordHash);

      if (!isPasswordValid) {
        const newAttempts = user.failedLoginAttempts + 1;

        if (newAttempts >= LOCKOUT_THRESHOLD) {
          // Lock the account
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
            },
          });
          throw new Error("LOCKED:15");
        } else {
          // Increment failed attempts
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: newAttempts },
          });
        }

        return null;
      }

      // Successful login — reset failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role as Role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        // Pass 2FA info so JWT callback can flag it
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorMethod: user.twoFactorMethod ?? undefined,
        phone: user.phone ?? undefined,
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
    async signIn({ user, account, profile, ...rest }) {
      // Extract IP and user-agent from request headers (available via request context)
      // In NextAuth v4, request is passed in the signIn callback params
      const req = (rest as { req?: { headers?: Record<string, string | string[] | undefined> } }).req;
      const ip =
        (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        (req?.headers?.["x-real-ip"] as string | undefined) ??
        "unknown";
      const userAgent = (req?.headers?.["user-agent"] as string | undefined) ?? "unknown";

      // For OAuth sign-ins, implement same-email auto-linking
      if (account && account.provider !== "credentials") {
        const email = user.email ?? (profile as { email?: string } | undefined)?.email;
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
        } else {
          // Brand new OAuth user — mark as needing role selection
          (user as { isNewOAuthUser?: boolean }).isNewOAuthUser = true;
        }

        // Record login and check for suspicious activity (OAuth)
        if (existingUser ?? user.id) {
          const targetUserId = existingUser?.id ?? user.id;
          if (targetUserId && email) {
            // Fire-and-forget: don't block sign-in for logging
            void recordLogin(targetUserId, ip, userAgent).catch(console.error);
            void checkSuspiciousLogin(targetUserId, ip, userAgent).then(async (suspicious) => {
              if (suspicious && email) {
                await sendSuspiciousLoginEmail(email, ip, userAgent, "fr").catch(console.error);
              }
            });
          }
        }
      } else if (account?.provider === "credentials") {
        // Record login and check suspicious activity for credentials login
        if (user.id && user.email) {
          void recordLogin(user.id, ip, userAgent).catch(console.error);
          void checkSuspiciousLogin(user.id, ip, userAgent).then(async (suspicious) => {
            if (suspicious && user.email) {
              await sendSuspiciousLoginEmail(user.email, ip, userAgent, "fr").catch(console.error);
            }
          });
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
        // Flag new OAuth users who need role selection
        if ((user as { isNewOAuthUser?: boolean }).isNewOAuthUser) {
          token.needsRoleSelection = true;
        }
        // Flag users who need 2FA challenge
        const typedUser = user as {
          twoFactorEnabled?: boolean;
          twoFactorMethod?: string;
          phone?: string;
        };
        if (typedUser.twoFactorEnabled) {
          token.needs2fa = true;
          token.twoFactorMethod = typedUser.twoFactorMethod;
          token.phone = typedUser.phone;
        }
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
          // Clear role selection flag after update (role has been set)
          if (trigger === "update") {
            token.needsRoleSelection = false;
            // Clear 2FA pending flag after update (2FA has been verified)
            token.needs2fa = false;
          }
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
