"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

// ============================================================
// HELPERS
// ============================================================

/**
 * Format a date to "yyyyMMdd" string for invoice number generation.
 * e.g. 2026-02-24 => "20260224"
 */
function formatDateCompact(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// ============================================================
// TYPES
// ============================================================

export interface InvoiceData {
  invoiceNumber: string; // TAWA-INV-{YYYYMMDD}-{short-id}
  date: string; // ISO date of releasedAt
  clientName: string;
  clientEmail: string;
  providerName: string;
  providerDisplayName: string;
  serviceTitle: string;
  serviceDescription: string;
  amount: number; // Total amount
  commission: number; // 12% commission
  netAmount: number; // providerEarning
  paymentMethod: string;
  referenceNumber: string; // payment.id
  bookingId: string;
  scheduledAt: string;
}

export interface MonthlyTransactionItem {
  id: string;
  date: string;
  serviceTitle: string;
  clientName: string;
  amount: number;
  commission: number;
  netAmount: number;
}

export interface MonthlyStatementData {
  period: string; // "YYYY-MM"
  providerName: string;
  providerDisplayName: string;
  summary: {
    totalMissions: number;
    grossRevenue: number;
    totalCommission: number;
    netEarnings: number;
  };
  transactions: MonthlyTransactionItem[];
}

// ============================================================
// ACTION 1: getInvoiceDataAction
// ============================================================

/**
 * Returns invoice data for a completed booking.
 *
 * Accessible by:
 * - The CLIENT who owns the booking (booking.clientId === userId)
 * - The PROVIDER who owns the booking's service (booking.service.provider.userId === userId)
 *
 * Only available for payments with HELD or RELEASED status.
 * Generates invoice number: TAWA-INV-{YYYYMMDD}-{last6OfPaymentId}
 */
export async function getInvoiceDataAction(
  bookingId: string,
): Promise<ActionResult<InvoiceData>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Fetch booking with payment, service, client, provider
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        isDeleted: false,
      },
      include: {
        payment: true,
        service: {
          select: {
            title: true,
            description: true,
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable" };
    }

    // Authorization: must be the client who owns the booking OR the provider
    const isClient = userRole === "CLIENT" && booking.clientId === userId;
    const isProvider =
      userRole === "PROVIDER" &&
      booking.service.provider.userId === userId;

    if (!isClient && !isProvider) {
      return { success: false, error: "Acces refuse" };
    }

    if (!booking.payment) {
      return {
        success: false,
        error: "Aucun paiement associe a cette reservation",
      };
    }

    const { payment } = booking;

    // Invoice only available for HELD or RELEASED payments
    if (payment.status !== "HELD" && payment.status !== "RELEASED") {
      return { success: false, error: "Facture non disponible" };
    }

    // Generate invoice number
    const invoiceDate = payment.releasedAt ?? payment.createdAt;
    const dateStr = formatDateCompact(invoiceDate);
    const shortId = payment.id.slice(-6).toUpperCase();
    const invoiceNumber = `TAWA-INV-${dateStr}-${shortId}`;

    const invoiceData: InvoiceData = {
      invoiceNumber,
      date: invoiceDate.toISOString(),
      clientName: booking.client.name ?? "Client",
      clientEmail: booking.client.email ?? "",
      providerName: booking.service.provider.user.name ?? "Prestataire",
      providerDisplayName: booking.service.provider.displayName,
      serviceTitle: booking.service.title,
      serviceDescription: booking.service.description ?? "",
      amount: payment.amount,
      commission: payment.commission,
      netAmount: payment.providerEarning,
      paymentMethod: payment.method,
      referenceNumber: payment.id,
      bookingId: booking.id,
      scheduledAt: booking.scheduledAt?.toISOString() ?? "",
    };

    return { success: true, data: invoiceData };
  } catch (error) {
    console.error("[getInvoiceDataAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation de la facture",
    };
  }
}

// ============================================================
// ACTION 2: getMonthlyStatementAction
// ============================================================

/**
 * Returns monthly earnings statement for the authenticated provider.
 *
 * - month param format: "YYYY-MM"
 * - Validates PROVIDER session
 * - Queries all RELEASED payments for provider in that month
 * - Aggregates: totalMissions, grossRevenue, totalCommission, netEarnings
 */
export async function getMonthlyStatementAction(
  month: string,
): Promise<ActionResult<MonthlyStatementData>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    // Validate month format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: "Format de mois invalide (YYYY-MM)" };
    }

    // Fetch provider record with user info
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // Parse month into start/end date range
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr ?? "2026", 10);
    const monthNum = parseInt(monthStr ?? "1", 10);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1); // exclusive

    // Query all RELEASED payments for this provider in the month
    const payments = await prisma.payment.findMany({
      where: {
        booking: { providerId: provider.id },
        status: "RELEASED",
        isDeleted: false,
        releasedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        booking: {
          include: {
            service: { select: { title: true } },
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { releasedAt: "asc" },
    });

    // Aggregate summary
    const summary = payments.reduce(
      (acc, p) => ({
        totalMissions: acc.totalMissions + 1,
        grossRevenue: acc.grossRevenue + p.amount,
        totalCommission: acc.totalCommission + p.commission,
        netEarnings: acc.netEarnings + p.providerEarning,
      }),
      { totalMissions: 0, grossRevenue: 0, totalCommission: 0, netEarnings: 0 },
    );

    // Map transactions
    const transactions: MonthlyTransactionItem[] = payments.map((p) => ({
      id: p.id,
      date: (p.releasedAt ?? p.createdAt).toISOString(),
      serviceTitle: p.booking.service.title,
      clientName: p.booking.client.name ?? "Client",
      amount: p.amount,
      commission: p.commission,
      netAmount: p.providerEarning,
    }));

    return {
      success: true,
      data: {
        period: month,
        providerName: provider.user.name ?? "Prestataire",
        providerDisplayName: provider.displayName,
        summary,
        transactions,
      },
    };
  } catch (error) {
    console.error("[getMonthlyStatementAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation du releve mensuel",
    };
  }
}
