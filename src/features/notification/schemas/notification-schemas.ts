import { z } from "zod";

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

/**
 * Schema for fetching paginated notifications list.
 */
export const getNotificationsSchema = z.object({
  filter: z.enum(["all", "unread"]).default("all"),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/**
 * Schema for marking a single notification as read.
 */
export const markNotificationReadSchema = z.object({
  notificationId: z.string().cuid(),
});

/**
 * Schema for updating notification preferences.
 */
export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  disabledTypes: z.array(z.string()),
});

// ============================================================
// TYPES
// ============================================================

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
