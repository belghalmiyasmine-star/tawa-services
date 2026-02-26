"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import {
  banUserSchema,
  unbanUserSchema,
  approveServiceSchema,
  suspendServiceSchema,
  createReportSchema,
  updateReportSchema,
  type BanUserInput,
  type UnbanUserInput,
  type ApproveServiceInput,
  type SuspendServiceInput,
  type CreateReportInput,
  type UpdateReportInput,
} from "../schemas/admin-schemas";

// ============================================================
// HELPERS
// ============================================================

/**
 * Check session and assert ADMIN role. Returns userId if valid.
 */
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

/**
 * Compute SLA deadline based on report priority.
 * CRITICAL: +2h, IMPORTANT: +24h, MINOR: +48h
 */
function computeSlaDeadline(
  priority: "CRITICAL" | "IMPORTANT" | "MINOR",
  from: Date = new Date(),
): Date {
  const deadlineMap = {
    CRITICAL: 2,
    IMPORTANT: 24,
    MINOR: 48,
  };
  const hoursToAdd = deadlineMap[priority];
  return new Date(from.getTime() + hoursToAdd * 60 * 60 * 1000);
}

// ============================================================
// USER MANAGEMENT ACTIONS
// ============================================================

/**
 * Ban a user. Sets isBanned=true, bannedAt=now, bannedReason.
 * Cannot ban ADMIN users.
 */
export async function banUserAction(
  data: BanUserInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = banUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId, isDeleted: false },
      select: { id: true, role: true, isBanned: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (user.role === "ADMIN") {
      return { success: false, error: "Impossible de bannir un administrateur" };
    }

    if (user.isBanned) {
      return { success: false, error: "Cet utilisateur est deja banni" };
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: parsed.data.reason,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[banUserAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Unban a user. Clears isBanned, bannedAt, bannedReason.
 */
export async function unbanUserAction(
  data: UnbanUserInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = unbanUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId, isDeleted: false },
      select: { id: true, isBanned: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (!user.isBanned) {
      return { success: false, error: "Cet utilisateur n'est pas banni" };
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[unbanUserAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Activate a user. Sets isActive=true.
 */
export async function activateUserAction(
  userId: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[activateUserAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Deactivate a user. Sets isActive=false.
 * Cannot deactivate ADMIN users.
 */
export async function deactivateUserAction(
  userId: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (user.role === "ADMIN") {
      return { success: false, error: "Impossible de desactiver un administrateur" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deactivateUserAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Soft-delete a user (isDeleted=true, deletedAt=now).
 * Cannot delete ADMIN users.
 */
export async function deleteUserAction(
  userId: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (user.role === "ADMIN") {
      return { success: false, error: "Impossible de supprimer un administrateur" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteUserAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// SERVICE MANAGEMENT ACTIONS
// ============================================================

/**
 * Approve a service. Sets status=ACTIVE.
 */
export async function approveServiceAction(
  data: ApproveServiceInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = approveServiceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId, isDeleted: false },
      select: { id: true, status: true },
    });

    if (!service) {
      return { success: false, error: "Service introuvable" };
    }

    await prisma.service.update({
      where: { id: parsed.data.serviceId },
      data: { status: "ACTIVE" },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[approveServiceAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Suspend a service. Sets status=SUSPENDED.
 */
export async function suspendServiceAction(
  data: SuspendServiceInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = suspendServiceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId, isDeleted: false },
      select: { id: true, status: true },
    });

    if (!service) {
      return { success: false, error: "Service introuvable" };
    }

    await prisma.service.update({
      where: { id: parsed.data.serviceId },
      data: { status: "SUSPENDED" },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[suspendServiceAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Toggle the isFeatured flag on a service.
 */
export async function toggleFeaturedAction(
  serviceId: string,
): Promise<ActionResult<{ isFeatured: boolean }>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isDeleted: false },
      select: { id: true, isFeatured: true },
    });

    if (!service) {
      return { success: false, error: "Service introuvable" };
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { isFeatured: !service.isFeatured },
      select: { isFeatured: true },
    });

    return { success: true, data: { isFeatured: updated.isFeatured } };
  } catch (error) {
    console.error("[toggleFeaturedAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// REPORT ACTIONS
// ============================================================

/**
 * Create a new report with computed SLA deadline.
 */
export async function createReportAction(
  data: CreateReportInput,
): Promise<ActionResult<{ reportId: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  const parsed = createReportSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const now = new Date();
    const slaDeadline = computeSlaDeadline(parsed.data.priority, now);

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedId: parsed.data.reportedId,
        type: parsed.data.type,
        reason: parsed.data.reason,
        description: parsed.data.description,
        priority: parsed.data.priority,
        referenceId: parsed.data.referenceId,
        slaDeadline,
        status: "OPEN",
      },
    });

    return { success: true, data: { reportId: report.id } };
  } catch (error) {
    console.error("[createReportAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Update a report's status and admin note.
 * If RESOLVED or DISMISSED, sets resolvedAt=now.
 */
export async function updateReportAction(
  data: UpdateReportInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateReportSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Donnees invalides" };
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: parsed.data.reportId, isDeleted: false },
      select: { id: true },
    });

    if (!report) {
      return { success: false, error: "Signalement introuvable" };
    }

    const isTerminal =
      parsed.data.status === "RESOLVED" || parsed.data.status === "DISMISSED";

    await prisma.report.update({
      where: { id: parsed.data.reportId },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
        resolvedAt: isTerminal ? new Date() : undefined,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateReportAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
