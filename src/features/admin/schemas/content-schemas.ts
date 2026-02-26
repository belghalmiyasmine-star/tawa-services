import { z } from "zod";

// ============================================================
// FAQ SCHEMAS
// ============================================================

export const createFaqSchema = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(10).max(5000),
  category: z
    .enum(["general", "booking", "payment", "provider"])
    .default("general"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateFaqSchema = createFaqSchema.extend({
  id: z.string(),
});

// ============================================================
// LEGAL PAGE SCHEMAS
// ============================================================

export const updateLegalPageSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
});

// ============================================================
// BANNER SCHEMAS
// ============================================================

export const createBannerSchema = z.object({
  title: z.string().min(3).max(200),
  subtitle: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
  position: z
    .enum(["homepage", "search", "category"])
    .default("homepage"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateBannerSchema = createBannerSchema.extend({
  id: z.string(),
});

// ============================================================
// INFERRED TYPES
// ============================================================

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type UpdateLegalPageInput = z.infer<typeof updateLegalPageSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
