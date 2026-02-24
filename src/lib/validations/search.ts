import { z } from "zod";

import { TUNISIA_GOUVERNORATS } from "@/lib/constants";

// ============================================================
// SCHEMAS VALIDATION RECHERCHE
// ============================================================

/**
 * Schema for search query parameters used by GET /api/search/services.
 *
 * All params are optional — the endpoint works with any combination of filters.
 * Coercion is used on numeric/boolean fields because URL searchParams are always strings.
 */
export const searchParamsSchema = z.object({
  /** Full-text search query — matched against title, description, provider displayName */
  q: z.string().optional(),

  /** Category slug (exact match, or parent slug to include all children) */
  category: z.string().optional(),

  /** Gouvernorat name from TUNISIA_GOUVERNORATS */
  city: z.enum(TUNISIA_GOUVERNORATS).optional(),

  /** Delegation name (sub-city area) */
  delegation: z.string().optional(),

  /** Minimum price in TND (inclusive) */
  minPrice: z.coerce.number().min(0).optional(),

  /** Maximum price in TND (inclusive) */
  maxPrice: z.coerce.number().max(100000).optional(),

  /** Pricing model filter */
  pricingType: z.enum(["FIXED", "SUR_DEVIS"]).optional(),

  /** When true, only return services from KYC-approved providers */
  verified: z.coerce.boolean().optional(),

  /** Minimum provider rating (0–5) */
  minRating: z.coerce.number().min(0).max(5).optional(),

  /** Sort order */
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "rating", "newest"])
    .optional()
    .default("relevance"),

  /** Page number (1-indexed) */
  page: z.coerce.number().int().min(1).optional().default(1),

  /** Results per page (max 50) */
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
