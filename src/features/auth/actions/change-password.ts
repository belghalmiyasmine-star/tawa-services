"use server";

import bcryptjs from "bcryptjs";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Change password for the current user.
 * Verifies current password before updating.
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Le nouveau mot de passe doit contenir au moins 8 caracteres" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (!user.passwordHash) {
      return { success: false, error: "Compte OAuth — impossible de changer le mot de passe" };
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Mot de passe incorrect" };
    }

    const newHash = await bcryptjs.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[changePasswordAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
