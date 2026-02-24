"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  calculateRefundPercentage,
  type CancellationResult,
} from "@/lib/utils/cancellation";
import {
  cancelBookingSchema,
  type CancelBookingFormData,
} from "@/lib/validations/booking";

type CancelBookingInput = CancelBookingFormData;

// ============================================================
// RETURN TYPE
// ============================================================

interface CancelBookingResult {
  refund: {
    tier: CancellationResult["tier"];
    refundPercentage: number;
    refundAmount: number;
  };
}

// ============================================================
// ACTION 1: cancelBookingAction (CLIENT-initiated)
// ============================================================

/**
 * Cancel a booking initiated by the client.
 *
 * - Only PENDING or ACCEPTED bookings can be cancelled.
 * - Refund is calculated using the tiered cancellation policy.
 * - Payment record is updated in the same transaction.
 */
export async function cancelBookingAction(
  data: CancelBookingInput,
): Promise<ActionResult<CancelBookingResult>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Accès réservé aux clients" };
    }

    const userId = session.user.id;

    // Validate input
    const parsed = cancelBookingSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message ?? "Données invalides";
      return { success: false, error: firstError };
    }

    const { bookingId, reason } = parsed.data;

    // Fetch booking and verify ownership
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        clientId: userId,
        isDeleted: false,
      },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable ou accès refusé",
      };
    }

    // Only PENDING or ACCEPTED can be cancelled
    if (booking.status !== "PENDING" && booking.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Impossible d'annuler une réservation en cours ou terminée",
      };
    }

    // Calculate refund — if no scheduledAt (quote-based booking not yet scheduled), give full refund
    const refundResult = booking.scheduledAt
      ? calculateRefundPercentage(booking.scheduledAt)
      : ({ tier: "FULL", refundPercentage: 100, hoursUntilScheduled: Infinity } as CancellationResult);

    const refundAmount =
      booking.payment && refundResult.refundPercentage > 0
        ? (booking.payment.amount * refundResult.refundPercentage) / 100
        : 0;

    const now = new Date();

    // Atomic transaction: update booking + payment
    await prisma.$transaction(async (tx) => {
      // Update booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledBy: "CLIENT",
          cancelReason: reason ?? null,
        },
      });

      // Update payment record if it exists and there is a refund
      if (booking.payment) {
        if (refundResult.refundPercentage === 100) {
          // Full refund
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: "REFUNDED",
              refundAmount,
              refundedAt: now,
            },
          });
        } else if (refundResult.refundPercentage > 0) {
          // Partial refund — keep payment status as PENDING (no full release)
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: {
              refundAmount,
              refundedAt: now,
            },
          });
        }
        // If refundPercentage === 0: payment stays PENDING — no refund
      }
    });

    return {
      success: true,
      data: {
        refund: {
          tier: refundResult.tier,
          refundPercentage: refundResult.refundPercentage,
          refundAmount,
        },
      },
    };
  } catch (error) {
    console.error("[cancelBookingAction] Error:", error);
    return { success: false, error: "Erreur lors de l'annulation" };
  }
}

// ============================================================
// ACTION 2: cancelBookingProviderAction (PROVIDER-initiated)
// ============================================================

/**
 * Cancel a booking initiated by the provider.
 *
 * Provider cancellation always gives the client a 100% refund
 * regardless of timing — provider-initiated = full responsibility.
 */
export async function cancelBookingProviderAction(
  bookingId: string,
  reason?: string,
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
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

    // Fetch booking and verify ownership via provider
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id,
        isDeleted: false,
      },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable ou accès refusé",
      };
    }

    // Only PENDING or ACCEPTED can be cancelled
    if (booking.status !== "PENDING" && booking.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Impossible d'annuler une réservation en cours ou terminée",
      };
    }

    const now = new Date();

    // Provider cancellation: always full refund
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledBy: "PROVIDER",
          cancelReason: reason ?? null,
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: "REFUNDED",
            refundAmount: booking.payment.amount,
            refundedAt: now,
          },
        });
      }
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[cancelBookingProviderAction] Error:", error);
    return { success: false, error: "Erreur lors de l'annulation" };
  }
}
