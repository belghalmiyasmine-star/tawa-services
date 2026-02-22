"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Server action to verify an email address using a verification token.
 * Validates the token (exists, not expired, not used), marks email as verified,
 * and marks the token as used.
 */
export async function verifyEmailAction(token: string): Promise<ActionResult<void>> {
  if (!token) {
    return { success: false, error: "Token invalide" };
  }

  try {
    // Find the verification token
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, emailVerified: true },
        },
      },
    });

    if (!verification) {
      return { success: false, error: "Token invalide" };
    }

    // Check if token has already been used
    if (verification.usedAt !== null) {
      // If email is already verified (from this or another token), treat as success
      if (verification.user.emailVerified) {
        return { success: true, data: undefined };
      }
      return { success: false, error: "Token deja utilise" };
    }

    // Check if token has expired
    if (verification.expiresAt < new Date()) {
      return { success: false, error: "Token expire" };
    }

    // Mark email as verified and token as used (in a transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[verifyEmailAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
