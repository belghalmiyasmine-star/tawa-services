import { z } from "zod";

// ============================================================
// PROCESS PAYMENT SCHEMA
// ============================================================

/**
 * Schema for initiating a payment checkout.
 * Used by processPaymentAction to validate client input.
 */
export const processPaymentSchema = z.object({
  bookingId: z.string().cuid("Identifiant de reservation invalide"),
  paymentMethod: z.enum(["CARD", "D17", "FLOUCI", "CASH"], {
    errorMap: () => ({ message: "Methode de paiement invalide" }),
  }),
});

export type ProcessPaymentFormData = z.infer<typeof processPaymentSchema>;

// ============================================================
// CHECKOUT CARD FORM SCHEMA
// ============================================================

/**
 * Schema for the simulated card form.
 * Format validation only — no real card processing occurs.
 */
export const checkoutFormSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Numero de carte invalide (16 chiffres requis)"),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Date d'expiration invalide (format MM/AA)"),
  cvv: z
    .string()
    .regex(/^\d{3}$/, "CVV invalide (3 chiffres requis)"),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// ============================================================
// RELEASE PAYMENT SCHEMA
// ============================================================

/**
 * Schema for releasing a payment (internal use).
 */
export const releasePaymentSchema = z.object({
  bookingId: z.string().cuid("Identifiant de reservation invalide"),
});

export type ReleasePaymentFormData = z.infer<typeof releasePaymentSchema>;
