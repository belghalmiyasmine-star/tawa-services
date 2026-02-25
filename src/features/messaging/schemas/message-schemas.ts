// ============================================================
// MESSAGING ZOD VALIDATION SCHEMAS
// ============================================================

import { z } from "zod";

/**
 * Schema for sending a message in a conversation.
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().cuid("Invalid conversation ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});

/**
 * Schema for fetching messages in a conversation with cursor-based pagination.
 */
export const getConversationMessagesSchema = z.object({
  conversationId: z.string().cuid("Invalid conversation ID"),
  cursor: z.string().optional(),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(30),
});

/**
 * Schema for fetching the conversations list with cursor-based pagination.
 */
export const getConversationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(20, "Limit cannot exceed 20")
    .default(20),
});

// Inferred types for convenience
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetConversationMessagesInput = z.infer<
  typeof getConversationMessagesSchema
>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
