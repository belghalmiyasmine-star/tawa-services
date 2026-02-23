"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  availabilitySchema,
  blockedDateSchema,
  type AvailabilityFormData,
  type BlockedDateFormData,
} from "@/lib/validations/provider";
import type { ActionResult } from "@/types/api";

/**
 * Server action to update provider weekly availability schedule.
 * Upserts 7 availability slots (one per day of week).
 */
export async function updateAvailabilityAction(
  data: unknown,
): Promise<ActionResult<{ updated: number }>> {
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
  const parsed = availabilitySchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { slots } = parsed.data;

  try {
    // 4. Find provider by userId
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    // 5. Upsert 7 availability slots in a transaction
    await prisma.$transaction(
      slots.map((slot) =>
        prisma.availability.upsert({
          where: {
            providerId_dayOfWeek: {
              providerId,
              dayOfWeek: slot.dayOfWeek,
            },
          },
          create: {
            providerId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive,
          },
          update: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive,
          },
        }),
      ),
    );

    return { success: true, data: { updated: 7 } };
  } catch (error) {
    console.error("[updateAvailabilityAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Server action to update provider blocked dates.
 * Replaces all existing blocked dates with the new list.
 */
export async function updateBlockedDatesAction(
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
  const parsed = blockedDateSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { dates } = parsed.data;

  try {
    // 4. Find provider by userId
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    // 5. Replace all blocked dates atomically
    await prisma.$transaction([
      // Delete all existing blocked dates
      prisma.blockedDate.deleteMany({
        where: { providerId },
      }),
      // Create new blocked dates
      prisma.blockedDate.createMany({
        data: dates.map((d) => ({
          providerId,
          date: new Date(d.date),
          reason: d.reason ?? null,
        })),
      }),
    ]);

    return { success: true, data: { count: dates.length } };
  } catch (error) {
    console.error("[updateBlockedDatesAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
