import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
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

      // Rate limit: 5 login attempts per minute per email
      const rl = rateLimit(`login:${credentials.email}`, 5, 60_000);
      if (!rl.allowed) {
        throw new Error("Trop de tentatives. Réessayez dans 1 minute.");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email, isDeleted: false },
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
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
        }

        // Record login for suspicious login detection (fire-and-forget)
        if (user.id && user.email) {
          void recordLogin(user.id, "unknown", "unknown").catch(console.error);
          void checkSuspiciousLogin(user.id, "unknown", "unknown")
            .then(async (suspicious) => {
              if (suspicious && user.email) {
                await sendSuspiciousLoginEmail(user.email, "unknown", "unknown", "fr").catch(console.error);
              }
            })
            .catch(console.error);
        }

        return true;
      } catch (error) {
        console.error("[signIn callback] Error:", error);
        // Don't block sign-in on callback errors
        return true;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, user object is available — attach data to token
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

      // Clear 2FA flag after successful 2FA verification
      const updateData = session as { clear2fa?: boolean } | null;
      if (trigger === "update" && updateData?.clear2fa) {
        token.needs2fa = false;
        token.twoFactorMethod = undefined;
        token.phone = undefined;
      }

      // Refresh from DB on explicit session update (e.g. after role change, email verify)
      // This avoids a DB query on every single request
      if (trigger === "update" && token.id && !updateData?.clear2fa) {
        try {
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
            token.role = dbUser.role as Role;
            token.emailVerified = dbUser.emailVerified;
            token.phoneVerified = dbUser.phoneVerified;
            token.needsRoleSelection = false;
          }
        } catch (error) {
          console.error("[jwt callback] DB refresh failed:", error);
          // Keep existing token data — don't break the session
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
