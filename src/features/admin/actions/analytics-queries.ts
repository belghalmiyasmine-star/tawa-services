"use server";

import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

export type AnalyticsKpis = {
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  conversionRate: number; // percentage 0-100
  satisfactionRate: number; // percentage 0-100 (stars/5 * 100)
  avgProviderValidationHours: number; // hours
};

export type MonthlyRevenue = { month: string; revenue: number };
export type MonthlyBookings = { month: string; count: number };
export type MonthlyUserGrowth = { month: string; newUsers: number };

export type AnalyticsData = {
  kpis: AnalyticsKpis;
  revenueByMonth: MonthlyRevenue[];
  bookingsByMonth: MonthlyBookings[];
  userGrowthByMonth: MonthlyUserGrowth[];
  revenueByCategory: { category: string; revenue: number }[];
  bookingsByStatus: {
    PENDING: number;
    ACCEPTED: number;
    COMPLETED: number;
    CANCELLED: number;
    REJECTED: number;
  };
};

export type GeographicBreakdownItem = {
  city: string;
  bookings: number;
  revenue: number;
};

export type TopCategoryItem = {
  category: string;
  services: number;
  bookings: number;
  revenue: number;
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

/**
 * Build date range filter from optional string dates.
 * Defaults to last 6 months if not provided.
 */
function buildDateRange(
  startDate?: string,
  endDate?: string,
): { gte: Date; lte: Date } {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const gte = startDate ? new Date(startDate) : defaultStart;
  const lte = endDate ? new Date(endDate) : now;

  return { gte, lte };
}

/**
 * Format a Date to "YYYY-MM" string.
 */
function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Build a map of all months from start to end, initialized to 0.
 */
function buildMonthRange(start: Date, end: Date): Map<string, number> {
  const map = new Map<string, number>();
  const cursor = new Date(start);
  cursor.setDate(1); // Start of month
  while (cursor <= end) {
    map.set(toMonthKey(cursor), 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return map;
}

// ============================================================
// ANALYTICS DATA ACTION
// ============================================================

/**
 * Get comprehensive analytics data for the admin dashboard.
 */
export async function getAnalyticsDataAction(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<AnalyticsData>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const dateRange = buildDateRange(startDate, endDate);

    // Run all queries in parallel
    const [
      activeUsersCount,
      releasedPayments,
      allBookingsInRange,
      reviews,
      providers,
      usersInRange,
    ] = await Promise.all([
      // Active users: isActive=true created in range OR has booking in range
      prisma.user.count({
        where: {
          isActive: true,
          isDeleted: false,
          OR: [
            { createdAt: dateRange },
            {
              clientBookings: {
                some: {
                  createdAt: dateRange,
                  isDeleted: false,
                },
              },
            },
          ],
        },
      }),
      // Released payments in range
      prisma.payment.findMany({
        where: {
          status: "RELEASED",
          isDeleted: false,
          createdAt: dateRange,
        },
        select: {
          amount: true,
          createdAt: true,
          booking: {
            select: {
              service: {
                select: {
                  category: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
      // All bookings in range for conversion + status breakdown
      prisma.booking.findMany({
        where: {
          isDeleted: false,
          createdAt: dateRange,
        },
        select: {
          status: true,
          createdAt: true,
        },
      }),
      // Published reviews in range for satisfaction rate
      prisma.review.findMany({
        where: {
          published: true,
          isDeleted: false,
          createdAt: dateRange,
        },
        select: {
          stars: true,
        },
      }),
      // Providers with APPROVED KYC for avg validation time
      prisma.provider.findMany({
        where: {
          kycStatus: "APPROVED",
          isDeleted: false,
          kycApprovedAt: { not: null },
          kycSubmittedAt: { not: null },
        },
        select: {
          createdAt: true,
          kycApprovedAt: true,
          kycSubmittedAt: true,
        },
      }),
      // Users created in range for growth chart
      prisma.user.findMany({
        where: {
          isDeleted: false,
          createdAt: dateRange,
        },
        select: { createdAt: true },
      }),
    ]);

    // ---- KPIs ----

    const totalTransactions = releasedPayments.length;
    const totalRevenue = releasedPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    const completedBookings = allBookingsInRange.filter(
      (b) => b.status === "COMPLETED",
    ).length;
    const conversionRate =
      allBookingsInRange.length > 0
        ? (completedBookings / allBookingsInRange.length) * 100
        : 0;

    const satisfactionRate =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.stars, 0) /
            reviews.length /
            5) *
          100
        : 0;

    // Avg provider validation time in hours
    let avgProviderValidationHours = 0;
    const validatedProviders = providers.filter(
      (p) => p.kycApprovedAt && p.kycSubmittedAt,
    );
    if (validatedProviders.length > 0) {
      const totalHours = validatedProviders.reduce((sum, p) => {
        const submitted = p.kycSubmittedAt!;
        const approved = p.kycApprovedAt!;
        const diffMs = approved.getTime() - submitted.getTime();
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      avgProviderValidationHours = totalHours / validatedProviders.length;
    }

    const kpis: AnalyticsKpis = {
      activeUsers: activeUsersCount,
      totalTransactions,
      totalRevenue,
      conversionRate,
      satisfactionRate,
      avgProviderValidationHours,
    };

    // ---- Monthly series ----

    // Revenue by month
    const revenueMonthMap = buildMonthRange(dateRange.gte, dateRange.lte);
    releasedPayments.forEach((p) => {
      const key = toMonthKey(p.createdAt);
      if (revenueMonthMap.has(key)) {
        revenueMonthMap.set(key, (revenueMonthMap.get(key) ?? 0) + p.amount);
      }
    });
    const revenueByMonth: MonthlyRevenue[] = Array.from(
      revenueMonthMap.entries(),
    ).map(([month, revenue]) => ({ month, revenue }));

    // Bookings by month
    const bookingsMonthMap = buildMonthRange(dateRange.gte, dateRange.lte);
    allBookingsInRange.forEach((b) => {
      const key = toMonthKey(b.createdAt);
      if (bookingsMonthMap.has(key)) {
        bookingsMonthMap.set(key, (bookingsMonthMap.get(key) ?? 0) + 1);
      }
    });
    const bookingsByMonth: MonthlyBookings[] = Array.from(
      bookingsMonthMap.entries(),
    ).map(([month, count]) => ({ month, count }));

    // User growth by month
    const userGrowthMap = buildMonthRange(dateRange.gte, dateRange.lte);
    usersInRange.forEach((u) => {
      const key = toMonthKey(u.createdAt);
      if (userGrowthMap.has(key)) {
        userGrowthMap.set(key, (userGrowthMap.get(key) ?? 0) + 1);
      }
    });
    const userGrowthByMonth: MonthlyUserGrowth[] = Array.from(
      userGrowthMap.entries(),
    ).map(([month, newUsers]) => ({ month, newUsers }));

    // ---- Breakdowns ----

    // Revenue by category (top 10)
    const categoryRevenueMap = new Map<string, number>();
    releasedPayments.forEach((p) => {
      const cat = p.booking.service.category.name;
      categoryRevenueMap.set(cat, (categoryRevenueMap.get(cat) ?? 0) + p.amount);
    });
    const revenueByCategory = Array.from(categoryRevenueMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Bookings by status
    const statusCounts = { PENDING: 0, ACCEPTED: 0, COMPLETED: 0, CANCELLED: 0, REJECTED: 0 };
    allBookingsInRange.forEach((b) => {
      if (b.status in statusCounts) {
        statusCounts[b.status as keyof typeof statusCounts]++;
      }
    });

    return {
      success: true,
      data: {
        kpis,
        revenueByMonth,
        bookingsByMonth,
        userGrowthByMonth,
        revenueByCategory,
        bookingsByStatus: statusCounts,
      },
    };
  } catch (error) {
    console.error("[getAnalyticsDataAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// GEOGRAPHIC BREAKDOWN ACTION
// ============================================================

/**
 * Get geographic breakdown: top 10 cities/delegations by bookings and revenue.
 */
export async function getGeographicBreakdownAction(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<GeographicBreakdownItem[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const dateRange = buildDateRange(startDate, endDate);

    // Get bookings with provider delegations and payments
    const bookings = await prisma.booking.findMany({
      where: {
        isDeleted: false,
        createdAt: dateRange,
      },
      select: {
        provider: {
          select: {
            delegations: {
              select: {
                delegation: {
                  select: { name: true },
                },
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    // Group by city/delegation
    const cityMap = new Map<string, { bookings: number; revenue: number }>();
    bookings.forEach((booking) => {
      const delegations = booking.provider.delegations;
      if (delegations.length === 0) return;

      // Use first delegation as primary city
      const cityName = delegations[0]?.delegation.name ?? "Inconnu";
      const entry = cityMap.get(cityName) ?? { bookings: 0, revenue: 0 };
      entry.bookings++;
      if (booking.payment?.status === "RELEASED") {
        entry.revenue += booking.payment.amount;
      }
      cityMap.set(cityName, entry);
    });

    const result: GeographicBreakdownItem[] = Array.from(cityMap.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    return { success: true, data: result };
  } catch (error) {
    console.error("[getGeographicBreakdownAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// TOP CATEGORIES ACTION
// ============================================================

/**
 * Get top 10 categories by booking count with services count and revenue.
 */
export async function getTopCategoriesAction(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<TopCategoryItem[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const dateRange = buildDateRange(startDate, endDate);

    // Get categories with service counts and bookings in range
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      select: {
        name: true,
        _count: {
          select: { services: true },
        },
        services: {
          where: { isDeleted: false },
          select: {
            bookings: {
              where: {
                isDeleted: false,
                createdAt: dateRange,
              },
              select: {
                payment: {
                  select: {
                    amount: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result: TopCategoryItem[] = categories
      .map((cat) => {
        let bookings = 0;
        let revenue = 0;
        cat.services.forEach((svc) => {
          svc.bookings.forEach((booking) => {
            bookings++;
            if (booking.payment?.status === "RELEASED") {
              revenue += booking.payment.amount;
            }
          });
        });
        return {
          category: cat.name,
          services: cat._count.services,
          bookings,
          revenue,
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    return { success: true, data: result };
  } catch (error) {
    console.error("[getTopCategoriesAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
