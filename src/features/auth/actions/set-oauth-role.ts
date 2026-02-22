"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

type SetOAuthRoleResult = {
  role: string;
  redirectTo: string;
};

/**
 * Sets the role for a first-time OAuth user.
 * Called from OAuthRoleSelection component after user picks CLIENT or PROVIDER.
 */
export async function setOAuthRoleAction(
  role: "CLIENT" | "PROVIDER",
): Promise<ActionResult<SetOAuthRoleResult>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Non authentifie. Veuillez vous connecter.",
    };
  }

  const userId = session.user.id;

  try {
    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true, name: true },
    });

    // If the user chose PROVIDER, create the Provider record
    if (role === "PROVIDER") {
      // Check if Provider record already exists (avoid duplicates)
      const existingProvider = await prisma.provider.findUnique({
        where: { userId },
      });

      if (!existingProvider) {
        await prisma.provider.create({
          data: {
            userId,
            displayName: session.user.name ?? updatedUser.name ?? "Prestataire",
          },
        });
      }
    }

    const redirectTo = role === "PROVIDER" ? "/provider/dashboard" : "/dashboard";

    return {
      success: true,
      data: {
        role: updatedUser.role,
        redirectTo,
      },
    };
  } catch {
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise a jour du profil.",
    };
  }
}
