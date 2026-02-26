"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import type { PaginatedResult } from "./admin-queries";

// ============================================================
// TYPES
// ============================================================

export type SystemNotificationInput = {
  segment: "all" | "clients" | "providers";
  title: string;
  body: string;
};

export type SystemNotificationHistoryItem = {
  title: string;
  body: string;
  sentCount: number;
  sentAt: Date;
};

// ============================================================
// SCHEMAS
// ============================================================

const sendSystemNotificationSchema = z.object({
  segment: z.enum(["all", "clients", "providers"]),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caracteres").max(200),
  body: z.string().min(10, "Le message doit contenir au moins 10 caracteres").max(2000),
});

// ============================================================
// HELPERS
// ============================================================

async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }
  return { success: true, data: { userId: session.user.id } };
}

// ============================================================
// SEND SYSTEM NOTIFICATION
// ============================================================

/**
 * Send a system notification to all users in a segment.
 * Creates Notification records in bulk.
 */
export async function sendSystemNotificationAction(
  data: SystemNotificationInput,
): Promise<ActionResult<{ sentCount: number }>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = sendSystemNotificationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  const { segment, title, body } = parsed.data;

  try {
    // Build user query based on segment
    const userWhere = {
      isDeleted: false,
      isActive: true,
      ...(segment === "clients" ? { role: "CLIENT" as const } : {}),
      ...(segment === "providers" ? { role: "PROVIDER" as const } : {}),
    };

    // Get target users
    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    if (users.length === 0) {
      return {
        success: true,
        data: { sentCount: 0 },
      };
    }

    // Create notifications in bulk
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: "SYSTEM" as const,
        title,
        body,
        read: false,
      })),
      skipDuplicates: false,
    });

    return {
      success: true,
      data: { sentCount: users.length },
    };
  } catch (error) {
    console.error("[sendSystemNotificationAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// NOTIFICATION HISTORY
// ============================================================

/**
 * Get recent system notifications grouped by title+body (minute precision).
 */
export async function getSystemNotificationHistoryAction(
  page = 1,
  pageSize = 20,
): Promise<ActionResult<PaginatedResult<SystemNotificationHistoryItem>>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    // Get all SYSTEM type notifications
    const notifications = await prisma.notification.findMany({
      where: {
        type: "SYSTEM",
        isDeleted: false,
      },
      select: {
        title: true,
        body: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by title+body+minute to aggregate batches
    type GroupKey = string;
    const grouped = new Map<
      GroupKey,
      { title: string; body: string | null; sentCount: number; sentAt: Date }
    >();

    for (const notif of notifications) {
      // Round to minute for grouping
      const d = new Date(notif.createdAt);
      d.setSeconds(0, 0);
      const minuteKey = d.toISOString();
      const key = `${notif.title}|||${notif.body ?? ""}|||${minuteKey}`;

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.sentCount += 1;
      } else {
        grouped.set(key, {
          title: notif.title,
          body: notif.body,
          sentCount: 1,
          sentAt: new Date(d),
        });
      }
    }

    // Convert to array sorted by sentAt DESC
    const all = Array.from(grouped.values()).sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime(),
    );

    const total = all.length;
    const skip = (page - 1) * pageSize;
    const items: SystemNotificationHistoryItem[] = all
      .slice(skip, skip + pageSize)
      .map((item) => ({
        title: item.title,
        body: item.body ?? "",
        sentCount: item.sentCount,
        sentAt: item.sentAt,
      }));

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("[getSystemNotificationHistoryAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
