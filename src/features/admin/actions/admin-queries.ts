"use server";

import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import {
  adminUserFilterSchema,
  adminServiceFilterSchema,
  adminReportFilterSchema,
  type AdminUserFilter,
  type AdminServiceFilter,
  type AdminReportFilter,
} from "../schemas/admin-schemas";

// ============================================================
// TYPES
// ============================================================

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  kycStatus: string | null;
};

export type AdminServiceListItem = {
  id: string;
  title: string;
  providerName: string;
  categoryName: string;
  price: number | null;
  status: string;
  isFeatured: boolean;
  createdAt: Date;
};

export type AdminReportListItem = {
  id: string;
  reporterName: string | null;
  reportedName: string | null;
  type: string;
  reason: string;
  priority: string;
  status: string;
  slaDeadline: Date | null;
  createdAt: Date;
};

export type AdminStats = {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingKyc: number;
  activeServices: number;
  openReports: number;
  previousMonthUsers: number;
  previousMonthBookings: number;
  previousMonthRevenue: number;
  currentMonthUsers: number;
  currentMonthBookings: number;
  currentMonthRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
};

export type AdminUserDetail = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  createdAt: Date;
  provider: {
    id: string;
    displayName: string;
    kycStatus: string;
  } | null;
  bookingsCount: number;
  reviewsCount: number;
  reportsCount: number;
};

export type AdminReportDetail = {
  id: string;
  type: string;
  reason: string;
  description: string | null;
  priority: string;
  status: string;
  adminNote: string | null;
  referenceId: string | null;
  slaDeadline: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  reporter: {
    id: string;
    name: string | null;
    email: string;
  };
  reported: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ============================================================
// HELPERS
// ============================================================

async function requireAdmin(): Promise<
  ActionResult<{ userId: string }>
> {
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
// ADMIN USER QUERIES
// ============================================================

/**
 * Get paginated list of users with optional filters.
 */
export async function getAdminUsersAction(
  rawFilters: Partial<AdminUserFilter> = {},
): Promise<ActionResult<PaginatedResult<AdminUserListItem>>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const filters = adminUserFilterSchema.parse(rawFilters);
  const { search, role, status, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  try {
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
      where.isBanned = false;
    } else if (status === "banned") {
      where.isBanned = true;
    } else if (status === "inactive") {
      where.isActive = false;
      where.isBanned = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          provider: {
            select: {
              kycStatus: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items: AdminUserListItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      role: u.role,
      isActive: u.isActive,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
      kycStatus: u.provider?.kycStatus ?? null,
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
    console.error("[getAdminUsersAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// ADMIN SERVICE QUERIES
// ============================================================

/**
 * Get paginated list of services with optional filters.
 */
export async function getAdminServicesAction(
  rawFilters: Partial<AdminServiceFilter> = {},
): Promise<ActionResult<PaginatedResult<AdminServiceListItem>>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const filters = adminServiceFilterSchema.parse(rawFilters);
  const { search, status, categoryId, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  try {
    const where: Prisma.ServiceWhereInput = {
      isDeleted: false,
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.category = {
        OR: [
          { id: categoryId },
          { parentId: categoryId },
        ],
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          pricingType: true,
          fixedPrice: true,
          status: true,
          isFeatured: true,
          createdAt: true,
          provider: {
            select: {
              displayName: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    const items: AdminServiceListItem[] = services.map((s) => ({
      id: s.id,
      title: s.title,
      providerName: s.provider.displayName,
      categoryName: s.category.name,
      price: s.fixedPrice,
      status: s.status,
      isFeatured: s.isFeatured,
      createdAt: s.createdAt,
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
    console.error("[getAdminServicesAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// ADMIN REPORT QUERIES
// ============================================================

/**
 * Get paginated list of reports ordered by priority then date.
 */
export async function getAdminReportsAction(
  rawFilters: Partial<AdminReportFilter> = {},
): Promise<ActionResult<PaginatedResult<AdminReportListItem>>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const filters = adminReportFilterSchema.parse(rawFilters);
  const { priority, status, type, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  try {
    const where: Prisma.ReportWhereInput = {
      isDeleted: false,
    };

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Priority ordering: CRITICAL first, then IMPORTANT, then MINOR
    const priorityOrder = { CRITICAL: 0, IMPORTANT: 1, MINOR: 2 };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          type: true,
          reason: true,
          priority: true,
          status: true,
          slaDeadline: true,
          createdAt: true,
          reporter: {
            select: {
              name: true,
            },
          },
          reported: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Sort by priority in memory (CRITICAL first)
    const sorted = reports.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2),
    );

    const items: AdminReportListItem[] = sorted.map((r) => ({
      id: r.id,
      reporterName: r.reporter.name,
      reportedName: r.reported?.name ?? null,
      type: r.type,
      reason: r.reason,
      priority: r.priority,
      status: r.status,
      slaDeadline: r.slaDeadline,
      createdAt: r.createdAt,
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
    console.error("[getAdminReportsAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// ADMIN STATS
// ============================================================

/**
 * Get comprehensive admin dashboard statistics.
 */
export async function getAdminStatsAction(): Promise<ActionResult<AdminStats>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Previous month boundaries
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = currentMonthStart;

    const [
      totalUsers,
      totalProviders,
      totalBookings,
      pendingKyc,
      activeServices,
      openReports,
      payments,
      bookingsByStatusRaw,
      usersLast6Months,
      currentMonthUsers,
      previousMonthUsers,
      currentMonthBookings,
      previousMonthBookings,
      currentMonthPayments,
      previousMonthPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.provider.count({ where: { isDeleted: false } }),
      prisma.booking.count({ where: { isDeleted: false } }),
      prisma.provider.count({
        where: { kycStatus: "PENDING", isDeleted: false },
      }),
      prisma.service.count({
        where: { status: "ACTIVE", isDeleted: false },
      }),
      prisma.report.count({
        where: { status: "OPEN", isDeleted: false },
      }),
      prisma.payment.findMany({
        where: {
          isDeleted: false,
          status: { in: ["RELEASED", "HELD"] },
          createdAt: { gte: sixMonthsAgo },
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
      prisma.booking.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: { status: true },
      }),
      prisma.user.findMany({
        where: {
          isDeleted: false,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Current month counts for trend arrows
      prisma.user.count({
        where: { isDeleted: false, createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      prisma.user.count({
        where: { isDeleted: false, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
      }),
      prisma.booking.count({
        where: { isDeleted: false, createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      prisma.booking.count({
        where: { isDeleted: false, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
      }),
      prisma.payment.aggregate({
        where: { isDeleted: false, status: { in: ["RELEASED", "HELD"] }, createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { isDeleted: false, status: { in: ["RELEASED", "HELD"] }, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
        _sum: { amount: true },
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Monthly revenue for last 6 months
    const monthlyRevenueMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenueMap.set(key, 0);
    }
    payments.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRevenueMap.has(key)) {
        monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + p.amount);
      }
    });
    const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(
      ([month, revenue]) => ({ month, revenue }),
    );

    // Bookings by status
    const bookingsByStatus = bookingsByStatusRaw.map((b) => ({
      status: b.status,
      count: b._count.status,
    }));

    // User growth for last 6 months
    const userGrowthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      userGrowthMap.set(key, 0);
    }
    usersLast6Months.forEach((u) => {
      const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (userGrowthMap.has(key)) {
        userGrowthMap.set(key, (userGrowthMap.get(key) ?? 0) + 1);
      }
    });
    const userGrowth = Array.from(userGrowthMap.entries()).map(
      ([month, count]) => ({ month, count }),
    );

    // Revenue by category
    const categoryRevenueMap = new Map<string, number>();
    payments.forEach((p) => {
      const categoryName = p.booking.service.category.name;
      categoryRevenueMap.set(
        categoryName,
        (categoryRevenueMap.get(categoryName) ?? 0) + p.amount,
      );
    });
    const revenueByCategory = Array.from(categoryRevenueMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      success: true,
      data: {
        totalUsers,
        totalProviders,
        totalBookings,
        totalRevenue,
        pendingKyc,
        activeServices,
        openReports,
        currentMonthUsers,
        previousMonthUsers,
        currentMonthBookings,
        previousMonthBookings,
        currentMonthRevenue: currentMonthPayments._sum.amount ?? 0,
        previousMonthRevenue: previousMonthPayments._sum.amount ?? 0,
        monthlyRevenue,
        bookingsByStatus,
        userGrowth,
        revenueByCategory,
      },
    };
  } catch (error) {
    console.error("[getAdminStatsAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// USER DETAIL
// ============================================================

/**
 * Get full user detail for admin view.
 */
export async function getUserDetailAction(
  userId: string,
): Promise<ActionResult<AdminUserDetail>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            displayName: true,
            kycStatus: true,
          },
        },
        clientBookings: {
          where: { isDeleted: false },
          select: { id: true },
        },
        reportsMade: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Count reviews authored by this user
    const reviewsCount = await prisma.review.count({
      where: { authorId: userId, isDeleted: false },
    });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        bannedReason: user.bannedReason,
        createdAt: user.createdAt,
        provider: user.provider
          ? {
              id: user.provider.id,
              displayName: user.provider.displayName,
              kycStatus: user.provider.kycStatus,
            }
          : null,
        bookingsCount: user.clientBookings.length,
        reviewsCount,
        reportsCount: user.reportsMade.length,
      },
    };
  } catch (error) {
    console.error("[getUserDetailAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// REPORT DETAIL
// ============================================================

/**
 * Get full report detail for admin view.
 */
export async function getReportDetailAction(
  reportId: string,
): Promise<ActionResult<AdminReportDetail>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId, isDeleted: false },
      select: {
        id: true,
        type: true,
        reason: true,
        description: true,
        priority: true,
        status: true,
        adminNote: true,
        referenceId: true,
        slaDeadline: true,
        resolvedAt: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reported: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return { success: false, error: "Signalement introuvable" };
    }

    return {
      success: true,
      data: {
        id: report.id,
        type: report.type,
        reason: report.reason,
        description: report.description,
        priority: report.priority,
        status: report.status,
        adminNote: report.adminNote,
        referenceId: report.referenceId,
        slaDeadline: report.slaDeadline,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
        reporter: {
          id: report.reporter.id,
          name: report.reporter.name,
          email: report.reporter.email,
        },
        reported: report.reported
          ? {
              id: report.reported.id,
              name: report.reported.name,
              email: report.reported.email,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("[getReportDetailAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
