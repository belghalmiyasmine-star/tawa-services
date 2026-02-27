"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// TOGGLE FAVORITE ACTION
// ============================================================

/**
 * Toggles the favorite state of a service for the authenticated user.
 *
 * - If already favorited: removes from favorites
 * - If not favorited: adds to favorites
 * - Returns the new favorited state
 */
export async function toggleFavoriteAction(
  serviceId: string,
): Promise<{ success: boolean; isFavorited?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_serviceId: { userId, serviceId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, serviceId } });
  }

  revalidatePath("/");
  revalidatePath("/services");

  return { success: true, isFavorited: !existing };
}
