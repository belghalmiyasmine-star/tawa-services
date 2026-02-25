import { z } from "zod";

// ============================================================
// REVIEW SUBMISSION SCHEMA
// ============================================================

/**
 * Schema for submitting a review after a completed booking.
 * Both clients (rating providers) and providers (rating clients) use this schema.
 */
export const reviewSubmitSchema = z.object({
  bookingId: z.string().cuid({ message: "ID de réservation invalide" }),

  // Overall star rating (required)
  stars: z
    .number()
    .int({ message: "La note doit être un entier" })
    .min(1, { message: "La note minimum est 1" })
    .max(5, { message: "La note maximum est 5" }),

  // Criteria ratings (required for full review)
  qualityRating: z
    .number()
    .int({ message: "La note qualité doit être un entier" })
    .min(1, { message: "La note minimum est 1" })
    .max(5, { message: "La note maximum est 5" }),

  punctualityRating: z
    .number()
    .int({ message: "La note ponctualité doit être un entier" })
    .min(1, { message: "La note minimum est 1" })
    .max(5, { message: "La note maximum est 5" }),

  communicationRating: z
    .number()
    .int({ message: "La note communication doit être un entier" })
    .min(1, { message: "La note minimum est 1" })
    .max(5, { message: "La note maximum est 5" }),

  cleanlinessRating: z
    .number()
    .int({ message: "La note propreté doit être un entier" })
    .min(1, { message: "La note minimum est 1" })
    .max(5, { message: "La note maximum est 5" }),

  // Review text (20–500 characters)
  text: z
    .string()
    .min(20, { message: "L'avis doit contenir au minimum 20 caractères" })
    .max(500, { message: "L'avis ne peut pas dépasser 500 caractères" }),

  // Optional photo URLs (max 3, enforced by schema before DB insert)
  photoUrls: z.array(z.string().url({ message: "URL de photo invalide" })).max(3, {
    message: "Maximum 3 photos autorisées",
  }).default([]),
});

export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
