"use server";

// ============================================================
// CONVERSATION READ-ONLY QUERIES
// ============================================================
//
// getConversationsAction: List all conversations for the current user.
// getConversationMessagesAction: Paginated message history for a conversation.
// getUnreadCountAction: Total unread messages across all conversations.
// getOrCreateConversationAction: Upsert a conversation for a booking.
// ============================================================

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  getConversationMessagesSchema,
} from "../schemas/message-schemas";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────

export interface ConversationListItem {
  id: string;
  otherUser: {
    name: string;
    photoUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
  booking: {
    id: string;
    serviceTitle: string;
    status: string;
  };
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  readAt: Date | null;
  flagged: boolean;
}

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

/**
 * Verifies that the given user is a participant of the conversation
 * (either the booking client or the provider's user account).
 */
async function checkIsParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, isDeleted: false },
    select: {
      booking: {
        select: {
          clientId: true,
          provider: { select: { userId: true } },
        },
      },
    },
  });

  if (!conversation) return false;

  const { booking } = conversation;
  return booking.clientId === userId || booking.provider.userId === userId;
}

// ────────────────────────────────────────────────
// GET CONVERSATIONS LIST
// ────────────────────────────────────────────────

/**
 * Returns all conversations for the authenticated user, sorted by
 * most recent message descending.
 *
 * Each item includes: other user info, last message preview, unread count,
 * and booking context (service title + status).
 */
export async function getConversationsAction(): Promise<
  ActionResult<ConversationListItem[]>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const userId = session.user.id;

  // Fetch all non-deleted conversations where the user is client or provider
  const conversations = await prisma.conversation.findMany({
    where: {
      isDeleted: false,
      booking: {
        isDeleted: false,
        OR: [
          { clientId: userId },
          { provider: { userId } },
        ],
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          clientId: true,
          client: {
            select: { name: true, avatarUrl: true },
          },
          provider: {
            select: {
              userId: true,
              displayName: true,
              photoUrl: true,
            },
          },
          service: {
            select: { title: true },
          },
        },
      },
      messages: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          isRead: true,
        },
      },
    },
  });

  // Build result items with unread counts
  const items: ConversationListItem[] = await Promise.all(
    conversations.map(async (conv) => {
      const { booking } = conv;
      const isClient = booking.clientId === userId;

      // The "other user" perspective
      const otherUser = isClient
        ? {
            name: booking.provider.displayName,
            photoUrl: booking.provider.photoUrl,
          }
        : {
            name: booking.client.name ?? "Client",
            photoUrl: booking.client.avatarUrl,
          };

      // Unread count: messages from the other party not yet read
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false,
          isDeleted: false,
        },
      });

      const lastMsg = conv.messages[0] ?? null;

      return {
        id: conv.id,
        otherUser,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              isFromMe: lastMsg.senderId === userId,
            }
          : null,
        unreadCount,
        booking: {
          id: booking.id,
          serviceTitle: booking.service.title,
          status: booking.status,
        },
      };
    }),
  );

  // Sort by last message createdAt descending (conversations with no messages go last)
  items.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt.getTime() ?? 0;
    const bTime = b.lastMessage?.createdAt.getTime() ?? 0;
    return bTime - aTime;
  });

  return { success: true, data: items };
}

// ────────────────────────────────────────────────
// GET CONVERSATION MESSAGES (PAGINATED)
// ────────────────────────────────────────────────

/**
 * Returns messages for a conversation using cursor-based pagination.
 * Messages are fetched newest-first internally, then reversed to
 * display oldest-first (natural chat order).
 */
export async function getConversationMessagesAction(params: {
  conversationId: string;
  cursor?: string;
  limit?: number;
}): Promise<
  ActionResult<{ messages: MessageItem[]; nextCursor: string | null }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  // Validate input
  const parseResult = getConversationMessagesSchema.safeParse(params);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message ?? "validation_error",
    };
  }

  const { conversationId, cursor, limit } = parseResult.data;

  // Verify user is a participant
  const isParticipant = await checkIsParticipant(
    conversationId,
    session.user.id,
  );
  if (!isParticipant) {
    return { success: false, error: "unauthorized" };
  }

  // Fetch limit + 1 to detect if there are more pages
  const rawMessages = await prisma.message.findMany({
    where: {
      conversationId,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
      isRead: true,
      readAt: true,
      flagged: true,
      sender: { select: { name: true } },
    },
  });

  // Determine next cursor
  const hasMore = rawMessages.length > limit;
  const messagesToReturn = hasMore ? rawMessages.slice(0, limit) : rawMessages;

  // nextCursor = createdAt of the oldest message in this batch (for fetching older messages)
  const nextCursor =
    hasMore && messagesToReturn.length > 0
      ? (messagesToReturn[messagesToReturn.length - 1]?.createdAt.toISOString() ?? null)
      : null;

  // Reverse to return oldest-first (natural chronological order for chat UI)
  const messages: MessageItem[] = messagesToReturn
    .reverse()
    .map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.name ?? "Utilisateur",
      content: msg.content,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      readAt: msg.readAt,
      flagged: msg.flagged,
    }));

  return { success: true, data: { messages, nextCursor } };
}

// ────────────────────────────────────────────────
// GET TOTAL UNREAD COUNT
// ────────────────────────────────────────────────

/**
 * Returns the total number of unread messages across all conversations
 * where the current user is a participant.
 */
export async function getUnreadCountAction(): Promise<
  ActionResult<{ total: number }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const userId = session.user.id;

  const total = await prisma.message.count({
    where: {
      isRead: false,
      isDeleted: false,
      senderId: { not: userId },
      conversation: {
        isDeleted: false,
        booking: {
          isDeleted: false,
          OR: [
            { clientId: userId },
            { provider: { userId } },
          ],
        },
      },
    },
  });

  return { success: true, data: { total } };
}

// ────────────────────────────────────────────────
// GET OR CREATE CONVERSATION
// ────────────────────────────────────────────────

/**
 * Retrieves the conversation for a booking, creating it if it does not exist.
 * Verifies the user is either the client or the provider on the booking.
 */
export async function getOrCreateConversationAction(
  bookingId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  if (!bookingId || typeof bookingId !== "string") {
    return { success: false, error: "invalid_booking_id" };
  }

  // Verify the user is a participant on this booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, isDeleted: false },
    select: {
      clientId: true,
      provider: { select: { userId: true } },
    },
  });

  if (!booking) {
    return { success: false, error: "booking_not_found" };
  }

  const isClient = booking.clientId === session.user.id;
  const isProvider = booking.provider.userId === session.user.id;

  if (!isClient && !isProvider) {
    return { success: false, error: "unauthorized" };
  }

  // Upsert conversation (idempotent — one conversation per booking)
  const conversation = await prisma.conversation.upsert({
    where: { bookingId },
    create: { bookingId },
    update: {},
    select: { id: true },
  });

  return { success: true, data: { conversationId: conversation.id } };
}
