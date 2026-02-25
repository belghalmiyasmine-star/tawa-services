"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  markNotificationReadSchema,
  updatePreferencesSchema,
} from "../schemas/notification-schemas";

// ============================================================
// ACTION 1: markNotificationReadAction
// ============================================================

/**
 * Mark a single notification as read.
 * Verifies ownership — only the notification's owner can mark it as read.
 */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    // Validate notificationId
    const parsed = markNotificationReadSchema.safeParse({ notificationId });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "ID invalide";
      return { success: false, error: firstError };
    }

    // Update notification — only if it belongs to current user
    const updated = await prisma.notification.updateMany({
      where: {
        id: parsed.data.notificationId,
        userId: session.user.id,
        isDeleted: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return { success: false, error: "Notification introuvable" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[markNotificationReadAction] Error:", error);
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

// ============================================================
// ACTION 2: markAllNotificationsReadAction
// ============================================================

/**
 * Mark all unread notifications as read for the current user.
 * Returns the count of updated notifications.
 */
export async function markAllNotificationsReadAction(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
        isDeleted: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("[markAllNotificationsReadAction] Error:", error);
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

// ============================================================
// ACTION 3: updateNotificationPreferencesAction
// ============================================================

/**
 * Update (upsert) notification preferences for the current user.
 * Handles emailEnabled, inAppEnabled, quietHours, and disabledTypes.
 */
export async function updateNotificationPreferencesAction(prefs: {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  disabledTypes: string[];
}): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    // Validate input
    const parsed = updatePreferencesSchema.safeParse(prefs);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        emailEnabled: parsed.data.emailEnabled,
        inAppEnabled: parsed.data.inAppEnabled,
        quietHoursStart: parsed.data.quietHoursStart,
        quietHoursEnd: parsed.data.quietHoursEnd,
        disabledTypes: parsed.data.disabledTypes,
      },
      create: {
        userId: session.user.id,
        emailEnabled: parsed.data.emailEnabled,
        inAppEnabled: parsed.data.inAppEnabled,
        quietHoursStart: parsed.data.quietHoursStart,
        quietHoursEnd: parsed.data.quietHoursEnd,
        disabledTypes: parsed.data.disabledTypes,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateNotificationPreferencesAction] Error:", error);
    return { success: false, error: "Erreur lors de la mise a jour des preferences" };
  }
}
