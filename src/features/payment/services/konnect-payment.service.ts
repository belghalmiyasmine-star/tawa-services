import crypto from "crypto";

import { prisma } from "@/lib/prisma";

import type {
  IPaymentService,
  ProcessPaymentInput,
  RefundPaymentInput,
  ReleasePaymentInput,
  PaymentResult,
} from "./payment-service.interface";

// ============================================================
// KONNECT PAYMENT SERVICE
// ============================================================

const KONNECT_API_URL =
  process.env.KONNECT_API_URL || "https://api.konnect.network";
const KONNECT_API_KEY = process.env.KONNECT_API_KEY!;
const KONNECT_WALLET_ID = process.env.KONNECT_WALLET_ID!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

interface KonnectInitResponse {
  payUrl: string;
  paymentRef: string;
}

/**
 * KonnectPaymentService — implements IPaymentService using the Konnect payment gateway.
 *
 * Flow:
 * 1. processPayment: POST /api/v2/payments/init-payment → returns payUrl for redirect
 * 2. User pays on Konnect hosted page
 * 3. Konnect calls our webhook → we update payment to HELD
 * 4. releasePayment / refundPayment remain DB-only (internal accounting)
 */
export class KonnectPaymentService implements IPaymentService {
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const { bookingId, method, amount } = input;

    // CASH payments bypass the gateway entirely
    if (method === "CASH") {
      return this.processCashPayment(bookingId, amount);
    }

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

    // Convert TND to millimes (Konnect expects amount in millimes)
    const amountInMillimes = Math.round(amount * 1000);

    const body = {
      receiverWalletId: KONNECT_WALLET_ID,
      amount: amountInMillimes,
      token: crypto.randomUUID().replace(/-/g, ""),
      type: "immediate",
      description: input.serviceTitle || "Paiement Tawa Services",
      lifespan: 30,
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName: input.clientFirstName || "",
      lastName: input.clientLastName || "",
      email: input.clientEmail || "",
      orderId: bookingId,
      webhook: `${APP_URL}/api/webhooks/konnect`,
      successUrl: `${APP_URL}/fr/bookings/${bookingId}/confirmation`,
      failUrl: `${APP_URL}/fr/bookings/${bookingId}/payment-failed`,
    };

    try {
      const response = await fetch(
        `${KONNECT_API_URL}/api/v2/payments/init-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": KONNECT_API_KEY,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[KonnectPaymentService] init-payment failed (${response.status}):`,
          errorText,
        );
        console.error("[Konnect] URL used:", `${KONNECT_API_URL}/api/v2/payments/init-payment`);
        return {
          success: false,
          referenceNumber: "",
          error: "Erreur lors de l'initialisation du paiement Konnect",
        };
      }

      const data = (await response.json()) as KonnectInitResponse;

      // Store gateway reference for webhook matching
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          method,
          amount,
          gatewayRef: data.paymentRef,
        },
      });

      return {
        success: true,
        referenceNumber: data.paymentRef,
        payUrl: data.payUrl,
      };
    } catch (error) {
      console.error("[KonnectPaymentService] processPayment error:", error);
      return {
        success: false,
        referenceNumber: "",
        error: "Erreur de connexion au service de paiement",
      };
    }
  }

  /**
   * Cash payments don't go through Konnect — just mark as HELD directly.
   */
  private async processCashPayment(
    bookingId: string,
    amount: number,
  ): Promise<PaymentResult> {
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

    const ref = `TAWA-CASH-${Date.now().toString(36).toUpperCase()}`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "HELD",
        heldAt: new Date(),
        method: "CASH",
        amount,
      },
    });

    return { success: true, referenceNumber: ref };
  }

  /**
   * Releases held funds to provider after booking completion.
   * This is internal accounting — no Konnect API call needed.
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
   * Note: Actual Konnect refund API integration can be added here later.
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
