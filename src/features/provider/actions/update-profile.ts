"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/lib/validations/provider";
import type { ActionResult } from "@/types/api";

/**
 * Server action to update provider profile information.
 * Validates session, role, and input before performing DB update.
 */
export async function updateProfileAction(
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Check role is PROVIDER
  if (session.user.role !== "PROVIDER") {
    return { success: false, error: "Acces reserve aux prestataires" };
  }

  const userId = session.user.id;

  // 3. Parse and validate input with Zod schema
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { displayName, bio, phone, yearsExperience, languages } = parsed.data;

  try {
    // 4. Update provider profile
    const provider = await prisma.provider.update({
      where: { userId },
      data: {
        displayName,
        bio: bio ?? null,
        phone: phone ?? null,
        yearsExperience: yearsExperience ?? null,
        languages: languages ?? [],
      },
      select: { id: true },
    });

    return { success: true, data: { id: provider.id } };
  } catch (error) {
    console.error("[updateProfileAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
