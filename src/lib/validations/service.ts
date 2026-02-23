import { z } from "zod";

import {
  SERVICE_TITLE_MAX_LENGTH,
  SERVICE_DESCRIPTION_MIN_LENGTH,
  SERVICE_DESCRIPTION_MAX_LENGTH,
} from "@/lib/constants";

// ============================================================
// SCHEMAS VALIDATION SERVICES
// ============================================================

/**
 * Base schema for service creation.
 *
 * Note on pricingType: The UI exposes 3 options (FIXED, HOURLY, SUR_DEVIS).
 * "HOURLY" is a UI concept — the DB PricingType enum only has FIXED and SUR_DEVIS.
 * When HOURLY is selected, the action stores pricingType=FIXED and fixedPrice=hourlyRate.
 */
export const createServiceSchema = z
  .object({
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caracteres")
      .max(
        SERVICE_TITLE_MAX_LENGTH,
        `Le titre ne peut pas depasser ${SERVICE_TITLE_MAX_LENGTH} caracteres`,
      ),
    description: z
      .string()
      .min(
        SERVICE_DESCRIPTION_MIN_LENGTH,
        `La description doit contenir au moins ${SERVICE_DESCRIPTION_MIN_LENGTH} caracteres`,
      )
      .max(
        SERVICE_DESCRIPTION_MAX_LENGTH,
        `La description ne peut pas depasser ${SERVICE_DESCRIPTION_MAX_LENGTH} caracteres`,
      ),
    categoryId: z.string().cuid2("Categorie invalide"),
    pricingType: z.enum(["FIXED", "HOURLY", "SUR_DEVIS"], {
      errorMap: () => ({ message: "Type de tarification invalide" }),
    }),
    fixedPrice: z
      .number()
      .min(1, "Le prix doit etre superieur a 0 TND")
      .max(100000, "Le prix ne peut pas depasser 100 000 TND")
      .optional(),
    durationMinutes: z
      .number()
      .int("La duree doit etre un entier")
      .min(15, "La duree minimum est de 15 minutes")
      .max(1440, "La duree maximum est de 1440 minutes (24h)")
      .optional(),
    inclusions: z
      .array(z.string().max(200, "Chaque inclusion ne peut pas depasser 200 caracteres"))
      .max(20, "Vous ne pouvez pas ajouter plus de 20 inclusions")
      .optional(),
    exclusions: z
      .array(z.string().max(200, "Chaque exclusion ne peut pas depasser 200 caracteres"))
      .max(20, "Vous ne pouvez pas ajouter plus de 20 exclusions")
      .optional(),
    conditions: z
      .string()
      .max(2000, "Les conditions ne peuvent pas depasser 2000 caracteres")
      .optional(),
  })
  .refine(
    (data) => {
      // fixedPrice is required when pricingType is FIXED or HOURLY
      if (data.pricingType === "FIXED" || data.pricingType === "HOURLY") {
        return data.fixedPrice !== undefined && data.fixedPrice > 0;
      }
      return true;
    },
    {
      message: "Le prix est requis pour les tarifications fixes ou horaires",
      path: ["fixedPrice"],
    },
  );

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;

/**
 * Schema for updating an existing service — extends createServiceSchema with id.
 */
export const updateServiceSchema = createServiceSchema.and(
  z.object({
    id: z.string().cuid2("Identifiant de service invalide"),
  }),
);

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;
