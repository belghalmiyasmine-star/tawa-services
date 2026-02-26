import { z } from "zod";

// ============================================================
// USER MANAGEMENT SCHEMAS
// ============================================================

export const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(5).max(500),
});

export const unbanUserSchema = z.object({
  userId: z.string(),
});

export const activateUserSchema = z.object({
  userId: z.string(),
});

export const deactivateUserSchema = z.object({
  userId: z.string(),
});

export const deleteUserSchema = z.object({
  userId: z.string(),
});

// ============================================================
// SERVICE MANAGEMENT SCHEMAS
// ============================================================

export const approveServiceSchema = z.object({
  serviceId: z.string(),
});

export const suspendServiceSchema = z.object({
  serviceId: z.string(),
  reason: z.string().min(5).max(500).optional(),
});

// ============================================================
// REPORT SCHEMAS
// ============================================================

export const createReportSchema = z.object({
  reportedId: z.string().optional(),
  type: z.enum(["USER", "SERVICE", "REVIEW", "MESSAGE"]),
  reason: z.string().min(10).max(2000),
  description: z.string().optional(),
  priority: z.enum(["CRITICAL", "IMPORTANT", "MINOR"]).default("MINOR"),
  referenceId: z.string().optional(),
});

export const updateReportSchema = z.object({
  reportId: z.string(),
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"]),
  adminNote: z.string().max(2000).optional(),
});

// ============================================================
// FILTER SCHEMAS
// ============================================================

export const adminUserFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["CLIENT", "PROVIDER", "ADMIN"]).optional(),
  status: z.enum(["active", "banned", "inactive"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(5).max(100).default(20),
});

export const adminServiceFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "DELETED"])
    .optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(5).max(100).default(20),
});

export const adminReportFilterSchema = z.object({
  search: z.string().optional(),
  priority: z.enum(["CRITICAL", "IMPORTANT", "MINOR"]).optional(),
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"]).optional(),
  type: z.enum(["USER", "SERVICE", "REVIEW", "MESSAGE"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(5).max(100).default(20),
});

// ============================================================
// INFERRED TYPES
// ============================================================

export type BanUserInput = z.infer<typeof banUserSchema>;
export type UnbanUserInput = z.infer<typeof unbanUserSchema>;
export type ApproveServiceInput = z.infer<typeof approveServiceSchema>;
export type SuspendServiceInput = z.infer<typeof suspendServiceSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type AdminUserFilter = z.infer<typeof adminUserFilterSchema>;
export type AdminServiceFilter = z.infer<typeof adminServiceFilterSchema>;
export type AdminReportFilter = z.infer<typeof adminReportFilterSchema>;
