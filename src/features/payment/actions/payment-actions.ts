"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import { processPaymentSchema } from "@/lib/validations/payment";
import { paymentService } from "../services/simulated-payment.service";
import { sendNotification } from "@/features/notification/lib/send-notification";

// ============================================================
// TYPES
// ============================================================

export interface PaymentInfo {
  id: string;
  method: string;
  status: string;
  amount: number;
  commission: number;
  providerEarning: number;
  heldAt: Date | null;
  releasedAt: Date | null;
  refundAmount: number | null;
  createdAt: Date;
}

// ============================================================
// ACTION 1: processPaymentAction
// ============================================================

/**
 * Initiates payment for a booking — transitions payment PENDING -> HELD.
 *
 * - Validates CLIENT role session
 * - Parses and validates input with processPaymentSchema
 * - Verifies booking belongs to the client
 * - Verifies booking status is PENDING or ACCEPTED
 * - Calls paymentService.processPayment to generate reference and set HELD
 */
export async function processPaymentAction(
  data: unknown,
): Promise<ActionResult<{ referenceNumber: string; payUrl?: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;

    const parsed = processPaymentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const { bookingId, paymentMethod } = parsed.data;

    // Verify booking belongs to this client, include service and client info
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        clientId: userId,
        isDeleted: false,
      },
      include: {
        service: { select: { title: true } },
        client: { select: { name: true, email: true } },
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable ou acces refuse" };
    }

    // Booking must be PENDING or ACCEPTED to process payment
    if (booking.status !== "PENDING" && booking.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Le paiement ne peut etre effectue que pour une reservation en attente ou acceptee",
      };
    }

    // Split client name into first/last for payment gateway
    const nameParts = (booking.client.name ?? "").split(" ");
    const clientFirstName = nameParts[0] || "";
    const clientLastName = nameParts.slice(1).join(" ") || "";

    const result = await paymentService.processPayment({
      bookingId,
      method: paymentMethod,
      amount: booking.totalAmount,
      serviceTitle: booking.service.title,
      clientFirstName,
      clientLastName,
      clientEmail: booking.client.email ?? undefined,
    });

    if (!result.success) {
      return { success: false, error: result.error ?? "Erreur lors du paiement" };
    }

    return {
      success: true,
      data: {
        referenceNumber: result.referenceNumber,
        ...(result.payUrl ? { payUrl: result.payUrl } : {}),
      },
    };
  } catch (error) {
    console.error("[processPaymentAction] Error:", error);
    return { success: false, error: "Erreur lors du traitement du paiement" };
  }
}

// ============================================================
// ACTION 2: releasePaymentAction
// ============================================================

/**
 * Releases held payment to provider minus 12% commission.
 *
 * This action is called INTERNALLY by completeBookingAction — not directly by users.
 * Validates PROVIDER role session.
 * Transitions payment HELD -> RELEASED with commission calculation.
 */
export async function releasePaymentAction(
  bookingId: string,
): Promise<ActionResult<{ providerEarning: number; commission: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const result = await paymentService.releasePayment({ bookingId });

    if (!result.success) {
      return { success: false, error: result.error ?? "Erreur lors de la liberation du paiement" };
    }

    // Fetch updated payment to return commission details + booking for notification
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      select: {
        commission: true,
        providerEarning: true,
        amount: true,
        booking: {
          select: {
            provider: { select: { userId: true } },
          },
        },
      },
    });

    if (!payment) {
      return { success: false, error: "Paiement introuvable apres liberation" };
    }

    // Fire-and-forget: notify provider that payment was released
    void sendNotification({
      userId: payment.booking.provider.userId,
      type: "PAYMENT_RECEIVED",
      title: "Paiement recu",
      body: `${payment.providerEarning.toFixed(2)} TND`,
      data: { bookingId },
    });

    return {
      success: true,
      data: {
        providerEarning: payment.providerEarning,
        commission: payment.commission,
      },
    };
  } catch (error) {
    console.error("[releasePaymentAction] Error:", error);
    return { success: false, error: "Erreur lors de la liberation du paiement" };
  }
}

// ============================================================
// ACTION 3: getPaymentByBookingAction
// ============================================================

/**
 * Returns payment details for a booking.
 *
 * Accessible by:
 * - The CLIENT who made the booking
 * - The PROVIDER who owns the booking's service
 */
export async function getPaymentByBookingAction(
  bookingId: string,
): Promise<ActionResult<PaymentInfo>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Fetch booking with payment and provider info for authorization
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        isDeleted: false,
      },
      include: {
        payment: true,
        service: {
          include: {
            provider: {
              select: { userId: true },
            },
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
      userRole === "PROVIDER" && booking.service.provider.userId === userId;

    if (!isClient && !isProvider) {
      return { success: false, error: "Acces refuse" };
    }

    if (!booking.payment) {
      return { success: false, error: "Aucun paiement associe a cette reservation" };
    }

    const { payment } = booking;

    return {
      success: true,
      data: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        commission: payment.commission,
        providerEarning: payment.providerEarning,
        heldAt: payment.heldAt,
        releasedAt: payment.releasedAt,
        refundAmount: payment.refundAmount,
        createdAt: payment.createdAt,
      },
    };
  } catch (error) {
    console.error("[getPaymentByBookingAction] Error:", error);
    return { success: false, error: "Erreur lors de la recuperation du paiement" };
  }
}
