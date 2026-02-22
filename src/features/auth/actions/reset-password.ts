"use server";

import bcryptjs from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types/api";

/**
 * Server action to reset a user's password using a valid reset token.
 * Validates the token (exists, not expired, not used), hashes the new password,
 * updates the user record, and marks the token as used.
 */
export async function resetPasswordAction(data: unknown): Promise<ActionResult<void>> {
  // Validate input
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { token, password } = parsed.data;

  try {
    // Find the reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!passwordReset) {
      return { success: false, error: "Token invalide" };
    }

    // Check if token has already been used
    if (passwordReset.usedAt !== null) {
      return { success: false, error: "Token deja utilise" };
    }

    // Check if token has expired (1 hour)
    if (passwordReset.expiresAt < new Date()) {
      return { success: false, error: "Token expire" };
    }

    // Hash the new password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Update user password and mark token as used (in a transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[resetPasswordAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
