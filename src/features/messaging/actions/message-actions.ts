"use server";

// ============================================================
// MESSAGE SERVER ACTIONS
// ============================================================
//
// sendMessageAction: Send a message in a conversation with moderation.
// markMessagesAsReadAction: Mark all unread messages from the other party as read.
// ============================================================

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import { moderateMessageContent } from "../lib/message-moderation";
import { sendMessageSchema } from "../schemas/message-schemas";
import { sendNotification } from "@/features/notification/lib/send-notification";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

/**
 * Verifies that the given userId is either the booking's client
 * or the booking's service provider user.
 * Returns the recipient's userId (the other participant) for notification purposes.
 */
async function verifyConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<{ authorized: boolean; bookingStatus: string; recipientId: string | null }> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, isDeleted: false },
    include: {
      booking: {
        select: {
          status: true,
          clientId: true,
          provider: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!conversation) {
    return { authorized: false, bookingStatus: "", recipientId: null };
  }

  const { booking } = conversation;
  const isClient = booking.clientId === userId;
  const isProvider = booking.provider.userId === userId;

  // Recipient is the other party
  const recipientId = isClient
    ? booking.provider.userId
    : isProvider
      ? booking.clientId
      : null;

  return {
    authorized: isClient || isProvider,
    bookingStatus: booking.status,
    recipientId,
  };
}

// ────────────────────────────────────────────────
// SEND MESSAGE ACTION
// ────────────────────────────────────────────────

/**
 * Sends a message in a conversation.
 *
 * - Validates input with sendMessageSchema.
 * - Verifies user is a participant (client or provider).
 * - Runs moderation: blocks contact info pre-booking.
 * - Persists the message via prisma.message.create.
 */
export async function sendMessageAction(formData: {
  conversationId: string;
  content: string;
}): Promise<ActionResult<{ messageId: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  // Validate input
  const parseResult = sendMessageSchema.safeParse(formData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message ?? "validation_error",
    };
  }

  const { conversationId, content } = parseResult.data;

  // Verify participation and get booking status + recipient
  const { authorized, bookingStatus, recipientId } = await verifyConversationParticipant(
    conversationId,
    session.user.id,
  );

  if (!authorized) {
    return { success: false, error: "unauthorized" };
  }

  // Run message moderation
  const moderation = moderateMessageContent(content, bookingStatus);
  if (moderation.blocked) {
    return { success: false, error: "contact_info_blocked" };
  }

  // Persist the message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: moderation.sanitizedContent ?? content,
    },
    select: { id: true },
  });

  // Fire-and-forget: notify recipient of new message
  if (recipientId) {
    void sendNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: "Nouveau message",
      body: content.substring(0, 100),
      data: { conversationId, senderId: session.user.id },
    });
  }

  return { success: true, data: { messageId: message.id } };
}

// ────────────────────────────────────────────────
// MARK MESSAGES AS READ ACTION
// ────────────────────────────────────────────────

/**
 * Marks all unread messages from the other participant as read.
 *
 * - Only marks messages where senderId !== current user (can't mark own as read).
 * - Returns count of updated messages.
 */
export async function markMessagesAsReadAction(
  conversationId: string,
): Promise<ActionResult<{ count: number }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  // Validate conversationId (simple non-empty check)
  if (!conversationId || typeof conversationId !== "string") {
    return { success: false, error: "invalid_conversation_id" };
  }

  // Verify participation (recipientId not needed for mark-read)
  const { authorized } = await verifyConversationParticipant(
    conversationId,
    session.user.id,
  );

  if (!authorized) {
    return { success: false, error: "unauthorized" };
  }

  // Mark messages from the other party as read
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      isRead: false,
      isDeleted: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true, data: { count: result.count } };
}
