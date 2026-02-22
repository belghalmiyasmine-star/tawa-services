import { z } from "zod";
import {
  PHONE_REGEX_TUNISIA,
  PASSWORD_MIN_LENGTH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/constants";

// ============================================================
// SCHEMAS DE BASE REUTILISABLES
// ============================================================

// ID CUID (validation format)
export const cuidSchema = z.string().cuid2();

// Phone tunisien (format +216 XX XXX XXX ou 8 chiffres)
export const tunisianPhoneSchema = z
  .string()
  .regex(PHONE_REGEX_TUNISIA, {
    message: "Numero de telephone invalide (format: +216 XX XXX XXX ou 8 chiffres)",
  });

// Password
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caracteres`,
  });

// Email
export const emailSchema = z
  .string()
  .email({ message: "Adresse email invalide" })
  .toLowerCase()
  .trim();

// Pagination
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : DEFAULT_PAGE_SIZE))
    .pipe(z.number().min(1).max(MAX_PAGE_SIZE)),
});

// Tri
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Recherche
export const searchSchema = z.object({
  q: z.string().min(2).max(100).optional(),
});

// Upload fichier (validation MIME type)
export const imageFileSchema = z.object({
  type: z.string().refine(
    (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
    { message: "Format accepte: JPEG, PNG, WebP" }
  ),
  size: z.number().max(5 * 1024 * 1024, { message: "Taille maximale: 5 MB" }),
});

export const documentFileSchema = z.object({
  type: z.string().refine(
    (type) =>
      ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(type),
    { message: "Format accepte: JPEG, PNG, WebP, PDF" }
  ),
  size: z.number().max(10 * 1024 * 1024, { message: "Taille maximale: 10 MB" }),
});
