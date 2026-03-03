import type { PaymentMethod } from "@/types";

// ============================================================
// INPUT TYPES
// ============================================================

export interface ProcessPaymentInput {
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  /** Service title — used as payment description for gateways */
  serviceTitle?: string;
  /** Client info for gateway checkout forms */
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
}

export interface ReleasePaymentInput {
  bookingId: string;
}

export interface RefundPaymentInput {
  bookingId: string;
  amount: number;
}

// ============================================================
// RESULT TYPE
// ============================================================

export interface PaymentResult {
  success: boolean;
  referenceNumber: string;
  error?: string;
  /** External payment URL for redirect-based gateways (e.g. Konnect) */
  payUrl?: string;
}

// ============================================================
// INTERFACE
// ============================================================

/**
 * IPaymentService — abstraction layer for payment processing.
 *
 * Current implementation: SimulatedPaymentService (DB-only, no real gateway).
 * Future implementation: KonnectPaymentService — implements this interface
 * without requiring any changes to server actions or UI.
 */
export interface IPaymentService {
  /**
   * Initiates payment — moves payment record from PENDING to HELD (escrow).
   * Called during client checkout flow.
   */
  processPayment(input: ProcessPaymentInput): Promise<PaymentResult>;

  /**
   * Releases held funds to provider minus 12% platform commission.
   * Called when provider marks booking as COMPLETED.
   */
  releasePayment(input: ReleasePaymentInput): Promise<PaymentResult>;

  /**
   * Processes a refund for a booking.
   * Called during cancellation flows when refund is applicable.
   */
  refundPayment(input: RefundPaymentInput): Promise<PaymentResult>;
}
