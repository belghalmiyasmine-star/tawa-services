import { prisma } from "@/lib/prisma";

import type {
  IPaymentService,
  ProcessPaymentInput,
  RefundPaymentInput,
  ReleasePaymentInput,
  PaymentResult,
} from "./payment-service.interface";

// ============================================================
// SIMULATED PAYMENT SERVICE
// ============================================================

/**
 * SimulatedPaymentService — implements IPaymentService using DB-only operations.
 *
 * No real payment gateway is called. This service simulates the escrow flow:
 * PENDING -> HELD (processPayment) -> RELEASED (releasePayment)
 *
 * To integrate a real gateway (e.g., Konnect), implement IPaymentService
 * in a new class and replace the singleton export below.
 */
export class SimulatedPaymentService implements IPaymentService {
  /**
   * Initiates payment for a booking — transitions payment PENDING -> HELD.
   * Generates a simulated reference number.
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const { bookingId, method, amount } = input;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return {
        success: false,
        referenceNumber: "",
        error: "Paiement introuvable pour cette reservation",
      };
    }

    if (payment.status !== "PENDING") {
      return {
        success: false,
        referenceNumber: "",
        error: `Le paiement est deja en statut ${payment.status}`,
      };
    }

    const ref = `TAWA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "HELD",
        heldAt: new Date(),
        method,
        amount,
      },
    });

    return { success: true, referenceNumber: ref };
  }

  /**
   * Releases held funds to provider after booking completion.
   * Deducts 12% platform commission and stores providerEarning.
   * Transitions payment HELD -> RELEASED.
   */
  async releasePayment(input: ReleasePaymentInput): Promise<PaymentResult> {
    const { bookingId } = input;

    const payment = await prisma.payment.findFirst({
      where: { bookingId, status: "HELD" },
    });

    if (!payment) {
      return {
        success: false,
        referenceNumber: "",
        error: "Aucun paiement en attente de liberation pour cette reservation",
      };
    }

    const commission = payment.amount * 0.12;
    const providerEarning = payment.amount - commission;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        commission,
        providerEarning,
      },
    });

    return { success: true, referenceNumber: payment.id };
  }

  /**
   * Processes a refund for a booking.
   * Updates payment with refund amount and transitions to REFUNDED status.
   */
  async refundPayment(input: RefundPaymentInput): Promise<PaymentResult> {
    const { bookingId, amount } = input;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return {
        success: false,
        referenceNumber: "",
        error: "Paiement introuvable pour cette reservation",
      };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundAmount: amount,
        refundedAt: new Date(),
      },
    });

    return { success: true, referenceNumber: payment.id };
  }
}

// ============================================================
// FACTORY EXPORT
// ============================================================

import { KonnectPaymentService } from "./konnect-payment.service";

/**
 * Payment service factory.
 * Uses KonnectPaymentService when KONNECT_API_KEY is set,
 * otherwise falls back to SimulatedPaymentService.
 */
function createPaymentService(): IPaymentService {
  if (process.env.KONNECT_API_KEY) {
    return new KonnectPaymentService();
  }

  return new SimulatedPaymentService();
}

export const paymentService: IPaymentService = createPaymentService();
