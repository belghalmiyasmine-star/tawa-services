import { z } from "zod";

import { tunisianPhoneSchema } from "@/lib/validations/common";

// ============================================================
// SCHEMAS VALIDATION PRESTATAIRE
// ============================================================

/**
 * Schema for updating provider profile information.
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Le nom d'affichage doit contenir au moins 2 caracteres")
    .max(100, "Le nom d'affichage ne peut pas depasser 100 caracteres"),
  bio: z
    .string()
    .max(2000, "La biographie ne peut pas depasser 2000 caracteres")
    .optional(),
  phone: tunisianPhoneSchema.optional().nullable(),
  yearsExperience: z
    .number()
    .int("Le nombre d'annees d'experience doit etre un entier")
    .min(0, "Le nombre d'annees d'experience ne peut pas etre negatif")
    .max(50, "Le nombre d'annees d'experience ne peut pas depasser 50")
    .optional(),
  languages: z
    .array(z.string())
    .max(10, "Vous ne pouvez pas selectionner plus de 10 langues")
    .optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ============================================================
// SCHEMA DISPONIBILITES HEBDOMADAIRES
// ============================================================

/**
 * Schema for weekly availability schedule.
 * Requires exactly 7 slots (one per day: Sunday=0 to Saturday=6).
 */
export const availabilitySchema = z
  .object({
    slots: z
      .array(
        z.object({
          dayOfWeek: z
            .number()
            .int()
            .min(0, "Jour de la semaine invalide")
            .max(6, "Jour de la semaine invalide"),
          startTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
          endTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
          isActive: z.boolean(),
        }),
      )
      .length(7, "Les disponibilites doivent couvrir les 7 jours de la semaine"),
  })
  .refine(
    (data) => {
      return data.slots.every((slot) => {
        if (!slot.isActive) return true;
        return slot.startTime < slot.endTime;
      });
    },
    {
      message:
        "L'heure de fin doit etre superieure a l'heure de debut pour chaque jour actif",
    },
  );

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

// ============================================================
// SCHEMA DATES BLOQUEES
// ============================================================

/**
 * Schema for blocked dates (provider vacation / unavailability).
 */
export const blockedDateSchema = z.object({
  dates: z.array(
    z.object({
      date: z.string().datetime("Format de date invalide"),
      reason: z
        .string()
        .max(200, "La raison ne peut pas depasser 200 caracteres")
        .optional(),
    }),
  ),
});

export type BlockedDateFormData = z.infer<typeof blockedDateSchema>;

// ============================================================
// SCHEMA ZONES D'INTERVENTION
// ============================================================

/**
 * Schema for provider intervention zones (Tunisian delegations).
 */
export const zoneSchema = z.object({
  delegationIds: z
    .array(z.string().cuid2("Identifiant de delegation invalide"))
    .min(1, "Selectionnez au moins une zone d'intervention"),
});

export type ZoneFormData = z.infer<typeof zoneSchema>;

// ============================================================
// SCHEMA PHOTO PORTFOLIO
// ============================================================

/**
 * Schema for portfolio photo caption update.
 */
export const portfolioPhotoSchema = z.object({
  caption: z
    .string()
    .max(200, "La legende ne peut pas depasser 200 caracteres")
    .optional(),
});

export type PortfolioPhotoFormData = z.infer<typeof portfolioPhotoSchema>;
