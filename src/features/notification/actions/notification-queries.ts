"use server";

import type { NotifType, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import { getNotificationsSchema } from "../schemas/notification-schemas";

// ============================================================
// TYPES
// ============================================================

export interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  read: boolean;
  readAt: Date | null;
  data: Record<string, string> | null;
  createdAt: Date;
}

export interface NotificationPrefs {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  disabledTypes: string[];
}

// ============================================================
// QUERY 1: getNotificationsAction
// ============================================================

/**
 * Fetch a paginated list of notifications for the current user.
 * Supports filtering by "all" or "unread" and cursor-based pagination.
 */
export async function getNotificationsAction(params?: {
  filter?: "all" | "unread";
  cursor?: string;
  limit?: number;
}): Promise<
  ActionResult<{ notifications: NotificationItem[]; nextCursor: string | null }>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    // Validate and apply defaults
    const parsed = getNotificationsSchema.safeParse({
      filter: params?.filter ?? "all",
      cursor: params?.cursor,
      limit: params?.limit ?? 20,
    });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const { filter, cursor, limit } = parsed.data;

    // Build where clause
    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
      isDeleted: false,
    };

    if (filter === "unread") {
      where.read = false;
    }

    // Cursor-based pagination (createdAt desc, id as cursor)
    if (cursor) {
      where.id = { lt: cursor };
    }

    // Fetch limit + 1 to determine if there's a next page
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && notifications.length > 0
        ? (notifications[notifications.length - 1]?.id ?? null)
        : null;

    const items: NotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      readAt: n.readAt,
      data:
        n.data !== null && typeof n.data === "object" && !Array.isArray(n.data)
          ? (n.data as Record<string, string>)
          : null,
      createdAt: n.createdAt,
    }));

    return { success: true, data: { notifications: items, nextCursor } };
  } catch (error) {
    console.error("[getNotificationsAction] Error:", error);
    return { success: false, error: "Erreur lors de la recuperation des notifications" };
  }
}

// ============================================================
// QUERY 2: getUnreadNotificationCountAction
// ============================================================

/**
 * Return the count of unread notifications for the current user.
 * Used to display the badge counter in navigation.
 */
export async function getUnreadNotificationCountAction(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
        isDeleted: false,
      },
    });

    return { success: true, data: { count } };
  } catch (error) {
    console.error("[getUnreadNotificationCountAction] Error:", error);
    return { success: false, error: "Erreur lors du comptage des notifications" };
  }
}

// ============================================================
// QUERY 3: getNotificationPreferencesAction
// ============================================================

/**
 * Fetch (or create with defaults) the notification preferences for the current user.
 */
export async function getNotificationPreferencesAction(): Promise<
  ActionResult<NotificationPrefs>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    // Upsert: create default preferences if they don't exist yet
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        emailEnabled: true,
        inAppEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        disabledTypes: [],
      },
    });

    return {
      success: true,
      data: {
        emailEnabled: prefs.emailEnabled,
        inAppEnabled: prefs.inAppEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        disabledTypes: prefs.disabledTypes,
      },
    };
  } catch (error) {
    console.error("[getNotificationPreferencesAction] Error:", error);
    return { success: false, error: "Erreur lors de la recuperation des preferences" };
  }
}
