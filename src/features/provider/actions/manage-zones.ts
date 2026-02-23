"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zoneSchema, type ZoneFormData } from "@/lib/validations/provider";
import type { ActionResult } from "@/types/api";

/**
 * Server action to update provider intervention zones.
 * Replaces all existing zones with the new selection atomically.
 */
export async function updateZonesAction(
  data: unknown,
): Promise<ActionResult<{ count: number }>> {
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

  // 3. Parse and validate input
  const parsed = zoneSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { delegationIds } = parsed.data;

  try {
    // 4. Find provider by userId
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // 5. Replace all zones atomically
    await prisma.$transaction([
      // Clear all existing zones
      prisma.providerDelegation.deleteMany({
        where: { providerId: provider.id },
      }),
      // Create new zones
      prisma.providerDelegation.createMany({
        data: delegationIds.map((delegationId) => ({
          providerId: provider.id,
          delegationId,
        })),
      }),
    ]);

    return { success: true, data: { count: delegationIds.length } };
  } catch (error) {
    console.error("[updateZonesAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
