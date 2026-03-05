"use server";

import { headers } from "next/headers";

import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types/api";

/**
 * Server action to initiate the password reset flow.
 * Accepts an email, generates a 1-hour reset token, invalidates any
 * existing tokens, and sends a reset email.
 * Always returns success (does not reveal if email exists).
 */
export async function forgotPasswordAction(
  data: unknown,
  locale: string = "fr",
): Promise<ActionResult<void>> {
  // Rate limit: 3 reset requests per minute per IP
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`forgot:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return { success: false, error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  // Validate input
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Email invalide";
    return { success: false, error: firstError };
  }

  const { email } = parsed.data;

  try {
    // Look up user — do NOT reveal if user exists (security)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      // Invalidate any existing (unused) password reset tokens for this user
      await prisma.passwordReset.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Generate new token (1 hour expiry)
      const token = crypto.randomUUID();
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Send the reset email
      await sendPasswordResetEmail(email, token, locale);
    }

    // Always return success regardless of whether email was found
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[forgotPasswordAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
