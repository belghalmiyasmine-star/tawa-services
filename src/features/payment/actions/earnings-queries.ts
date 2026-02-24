"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

export interface EarningsSummary {
  available: number;
  pending: number;
  totalEarned: number;
  totalCommission: number;
}

export interface MonthlyBreakdown {
  month: string; // "YYYY-MM"
  missions: number;
  grossRevenue: number;
  commission: number;
  netEarnings: number;
}

export interface TransactionItem {
  id: string;
  bookingId: string;
  serviceTitle: string;
  clientName: string;
  amount: number;
  commission: number;
  providerEarning: number;
  status: string;
  method: string;
  createdAt: Date;
  releasedAt: Date | null;
}

// ============================================================
// ACTION 1: getProviderEarningsAction
// ============================================================

/**
 * Returns earnings summary for the authenticated provider.
 *
 * - available: SUM(providerEarning) from RELEASED payments with no WithdrawalRequest
 * - pending: SUM(amount) from HELD payments
 * - totalEarned: SUM(providerEarning) from all RELEASED payments
 * - totalCommission: SUM(commission) from all RELEASED payments
 */
export async function getProviderEarningsAction(): Promise<
  ActionResult<EarningsSummary>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    // Fetch provider record
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    // Aggregate in parallel
    const [releasedAggregate, pendingAggregate, availablePayments] =
      await Promise.all([
        // totalEarned + totalCommission from all RELEASED payments
        prisma.payment.aggregate({
          where: {
            booking: { providerId },
            status: "RELEASED",
            isDeleted: false,
          },
          _sum: {
            providerEarning: true,
            commission: true,
          },
        }),
        // pending: sum of amounts in HELD status
        prisma.payment.aggregate({
          where: {
            booking: { providerId },
            status: "HELD",
            isDeleted: false,
          },
          _sum: {
            amount: true,
          },
        }),
        // available: RELEASED payments with no withdrawal request
        prisma.payment.aggregate({
          where: {
            booking: { providerId },
            status: "RELEASED",
            isDeleted: false,
            withdrawalRequest: null,
          },
          _sum: {
            providerEarning: true,
          },
        }),
      ]);

    return {
      success: true,
      data: {
        available: availablePayments._sum.providerEarning ?? 0,
        pending: pendingAggregate._sum.amount ?? 0,
        totalEarned: releasedAggregate._sum.providerEarning ?? 0,
        totalCommission: releasedAggregate._sum.commission ?? 0,
      },
    };
  } catch (error) {
    console.error("[getProviderEarningsAction] Error:", error);
    return { success: false, error: "Erreur lors de la recuperation des revenus" };
  }
}

// ============================================================
// ACTION 2: getMonthlyBreakdownAction
// ============================================================

/**
 * Returns monthly breakdown of earnings for the authenticated provider.
 *
 * Groups RELEASED payments by year-month (from releasedAt).
 * Returns array sorted by month descending (newest first).
 */
export async function getMonthlyBreakdownAction(): Promise<
  ActionResult<MonthlyBreakdown[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    // Fetch all released payments with releasedAt for grouping
    const payments = await prisma.payment.findMany({
      where: {
        booking: { providerId },
        status: "RELEASED",
        isDeleted: false,
        releasedAt: { not: null },
      },
      select: {
        amount: true,
        commission: true,
        providerEarning: true,
        releasedAt: true,
      },
      orderBy: { releasedAt: "desc" },
    });

    // Group by YYYY-MM
    const monthMap = new Map<
      string,
      { missions: number; grossRevenue: number; commission: number; netEarnings: number }
    >();

    for (const p of payments) {
      if (!p.releasedAt) continue;
      const d = p.releasedAt;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthMap.get(month);
      if (existing) {
        existing.missions += 1;
        existing.grossRevenue += p.amount;
        existing.commission += p.commission;
        existing.netEarnings += p.providerEarning;
      } else {
        monthMap.set(month, {
          missions: 1,
          grossRevenue: p.amount,
          commission: p.commission,
          netEarnings: p.providerEarning,
        });
      }
    }

    // Convert to sorted array (newest first)
    const breakdown: MonthlyBreakdown[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("[getMonthlyBreakdownAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation du recapitulatif mensuel",
    };
  }
}

// ============================================================
// ACTION 3: getTransactionHistoryAction
// ============================================================

/**
 * Returns all payment transactions for the authenticated provider.
 *
 * Includes HELD, RELEASED, and REFUNDED payments.
 * Ordered by createdAt descending.
 */
export async function getTransactionHistoryAction(): Promise<
  ActionResult<TransactionItem[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    const payments = await prisma.payment.findMany({
      where: {
        booking: { providerId },
        status: { in: ["HELD", "RELEASED", "REFUNDED"] },
        isDeleted: false,
      },
      include: {
        booking: {
          include: {
            service: {
              select: { title: true },
            },
            client: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transactions: TransactionItem[] = payments.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      serviceTitle: p.booking.service.title,
      clientName: p.booking.client.name ?? "Client",
      amount: p.amount,
      commission: p.commission,
      providerEarning: p.providerEarning,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
      releasedAt: p.releasedAt,
    }));

    return { success: true, data: transactions };
  } catch (error) {
    console.error("[getTransactionHistoryAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation de l'historique",
    };
  }
}
