import { z } from "zod";

// ============================================================
// CATEGORY SCHEMAS
// ============================================================

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string(),
});

// ============================================================
// INFERRED TYPES
// ============================================================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
