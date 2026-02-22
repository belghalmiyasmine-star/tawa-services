"use server";

import bcryptjs from "bcryptjs";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Disable 2FA for the current user.
 * Requires current password verification for security.
 */
export async function disable2faAction(
  currentPassword: string,
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (!user.twoFactorEnabled) {
      return { success: false, error: "La 2FA n'est pas activee" };
    }

    // Verify current password (required for security)
    if (!user.passwordHash) {
      return {
        success: false,
        error:
          "Compte OAuth — impossible de verifier le mot de passe",
      };
    }

    const isPasswordValid = await bcryptjs.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Mot de passe incorrect",
      };
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        totpSecret: null,
        totpSecretTemp: null,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[disable2faAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
