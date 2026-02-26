"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import type { PaginatedResult } from "./admin-queries";

// ============================================================
// TYPES
// ============================================================

export type CommissionOverview = {
  commissionRate: number;
  totalRevenue: number;
  totalCommission: number;
  totalPayouts: number;
  pendingPayouts: number;
  withdrawalsPending: number;
  withdrawalsProcessed: number;
  monthlyCommission: { month: string; commission: number; revenue: number }[];
};

export type ProviderPayoutItem = {
  userId: string;
  displayName: string;
  totalEarnings: number;
  totalCommission: number;
  pendingAmount: number;
  withdrawalsTotal: number;
  lastPayoutDate: Date | null;
};

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
// COMMISSION OVERVIEW
// ============================================================

/**
 * Get commission overview: 12% rate, totals, pending payouts, withdrawal stats.
 */
export async function getCommissionOverviewAction(): Promise<
  ActionResult<CommissionOverview>
> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const now = new Date();

    // Build last 6 months keys
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      monthKeys.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    const [
      releasedPayments,
      heldPayments,
      withdrawalsPending,
      withdrawalsPaidAgg,
    ] = await Promise.all([
      // Payments that have been released (revenue + commission realized)
      prisma.payment.findMany({
        where: { isDeleted: false, status: "RELEASED" },
        select: {
          amount: true,
          commission: true,
          providerEarning: true,
          releasedAt: true,
          createdAt: true,
        },
      }),
      // Payments on hold (pending payouts)
      prisma.payment.aggregate({
        where: { isDeleted: false, status: "HELD" },
        _sum: { providerEarning: true },
      }),
      // Pending withdrawal requests count
      prisma.withdrawalRequest.count({
        where: { isDeleted: false, status: "PENDING" },
      }),
      // Total paid out via withdrawals
      prisma.withdrawalRequest.aggregate({
        where: { isDeleted: false, status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    // Compute totals from released payments
    const totalRevenue = releasedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = releasedPayments.reduce(
      (sum, p) => sum + p.commission,
      0,
    );
    const totalPayouts = releasedPayments.reduce(
      (sum, p) => sum + p.providerEarning,
      0,
    );

    // Monthly grouping for last 6 months
    const monthlyMap = new Map<string, { commission: number; revenue: number }>(
      monthKeys.map((k) => [k, { commission: 0, revenue: 0 }]),
    );

    releasedPayments.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        const existing = monthlyMap.get(key)!;
        monthlyMap.set(key, {
          commission: existing.commission + p.commission,
          revenue: existing.revenue + p.amount,
        });
      }
    });

    const monthlyCommission = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({ month, ...data }),
    );

    return {
      success: true,
      data: {
        commissionRate: 0.12,
        totalRevenue,
        totalCommission,
        totalPayouts,
        pendingPayouts: heldPayments._sum.providerEarning ?? 0,
        withdrawalsPending,
        withdrawalsProcessed: withdrawalsPaidAgg._sum.amount ?? 0,
        monthlyCommission,
      },
    };
  } catch (error) {
    console.error("[getCommissionOverviewAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// PROVIDER PAYOUTS TABLE
// ============================================================

/**
 * Get paginated provider payout summary ordered by total earnings DESC.
 */
export async function getProviderPayoutsAction(
  page = 1,
  pageSize = 20,
): Promise<ActionResult<PaginatedResult<ProviderPayoutItem>>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    // Fetch all relevant payments with provider info
    const payments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        status: { in: ["RELEASED", "HELD"] },
        booking: {
          isDeleted: false,
        },
      },
      select: {
        status: true,
        providerEarning: true,
        commission: true,
        releasedAt: true,
        withdrawalRequest: {
          select: {
            amount: true,
            status: true,
          },
        },
        booking: {
          select: {
            provider: {
              select: {
                userId: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Group by provider
    type ProviderAccumulator = {
      userId: string;
      displayName: string;
      totalEarnings: number;
      totalCommission: number;
      pendingAmount: number;
      withdrawalsTotal: number;
      lastPayoutDate: Date | null;
    };

    const providerMap = new Map<string, ProviderAccumulator>();

    for (const payment of payments) {
      const { userId, displayName } = payment.booking.provider;

      if (!providerMap.has(userId)) {
        providerMap.set(userId, {
          userId,
          displayName,
          totalEarnings: 0,
          totalCommission: 0,
          pendingAmount: 0,
          withdrawalsTotal: 0,
          lastPayoutDate: null,
        });
      }

      const acc = providerMap.get(userId)!;

      if (payment.status === "RELEASED") {
        acc.totalEarnings += payment.providerEarning;
        acc.totalCommission += payment.commission;

        if (payment.releasedAt) {
          if (!acc.lastPayoutDate || payment.releasedAt > acc.lastPayoutDate) {
            acc.lastPayoutDate = payment.releasedAt;
          }
        }
      } else if (payment.status === "HELD") {
        acc.pendingAmount += payment.providerEarning;
      }

      if (payment.withdrawalRequest?.status === "PAID") {
        acc.withdrawalsTotal += payment.withdrawalRequest.amount;
      }
    }

    const summaries: ProviderPayoutItem[] = Array.from(providerMap.values());

    // Sort by totalEarnings DESC
    summaries.sort((a, b) => b.totalEarnings - a.totalEarnings);

    const total = summaries.length;
    const skip = (page - 1) * pageSize;
    const items = summaries.slice(skip, skip + pageSize);

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
    console.error("[getProviderPayoutsAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
