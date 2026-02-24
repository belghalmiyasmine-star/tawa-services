import { z } from "zod";

// ============================================================
// SCHEMAS VALIDATION RESERVATIONS
// ============================================================

/**
 * Schema for creating a direct booking (fixed-price service).
 */
export const createBookingSchema = z.object({
  serviceId: z.string().cuid("Identifiant de service invalide"),
  scheduledAt: z
    .string()
    .datetime("Format de date invalide")
    .refine((val) => new Date(val) > new Date(), {
      message: "La date doit etre dans le futur",
    }),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres")
    .max(200, "L'adresse ne peut pas depasser 200 caracteres"),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres")
    .max(100, "La ville ne peut pas depasser 100 caracteres"),
  clientNote: z
    .string()
    .max(1000, "La note ne peut pas depasser 1000 caracteres")
    .optional(),
  paymentMethod: z.enum(["CARD", "D17", "FLOUCI", "CASH"], {
    errorMap: () => ({ message: "Methode de paiement invalide" }),
  }),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;

/**
 * Schema for submitting a quote request (sur devis service).
 */
export const createQuoteSchema = z.object({
  serviceId: z.string().cuid("Identifiant de service invalide"),
  description: z
    .string()
    .min(50, "La description doit contenir au moins 50 caracteres")
    .max(2000, "La description ne peut pas depasser 2000 caracteres"),
  preferredDate: z
    .string()
    .datetime("Format de date invalide")
    .optional(),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres")
    .max(200, "L'adresse ne peut pas depasser 200 caracteres"),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres")
    .max(100, "La ville ne peut pas depasser 100 caracteres"),
  budget: z
    .number()
    .positive("Le budget doit etre positif")
    .optional(),
});

export type CreateQuoteFormData = z.infer<typeof createQuoteSchema>;

/**
 * Schema for provider responding to a quote with proposed price and delay.
 */
export const respondQuoteSchema = z.object({
  quoteId: z.string().cuid("Identifiant de devis invalide"),
  proposedPrice: z.number().positive("Le prix propose doit etre positif"),
  proposedDelay: z
    .string()
    .max(200, "Le delai propose ne peut pas depasser 200 caracteres")
    .optional(),
});

export type RespondQuoteFormData = z.infer<typeof respondQuoteSchema>;

/**
 * Schema for client accepting a quote and scheduling the booking.
 */
export const acceptQuoteSchema = z.object({
  quoteId: z.string().cuid("Identifiant de devis invalide"),
  scheduledAt: z
    .string()
    .datetime("Format de date invalide")
    .refine((val) => new Date(val) > new Date(), {
      message: "La date doit etre dans le futur",
    }),
  paymentMethod: z.enum(["CARD", "D17", "FLOUCI", "CASH"], {
    errorMap: () => ({ message: "Methode de paiement invalide" }),
  }),
});

export type AcceptQuoteFormData = z.infer<typeof acceptQuoteSchema>;

/**
 * Schema for provider rejecting a booking with optional reason.
 */
export const rejectBookingSchema = z.object({
  bookingId: z.string().cuid("Identifiant de reservation invalide"),
  reason: z
    .string()
    .max(500, "La raison ne peut pas depasser 500 caracteres")
    .optional(),
});

export type RejectBookingFormData = z.infer<typeof rejectBookingSchema>;

/**
 * Schema for client or provider cancelling a booking with optional reason.
 */
export const cancelBookingSchema = z.object({
  bookingId: z.string().cuid("Identifiant de reservation invalide"),
  reason: z
    .string()
    .max(500, "La raison ne peut pas depasser 500 caracteres")
    .optional(),
});

export type CancelBookingFormData = z.infer<typeof cancelBookingSchema>;
