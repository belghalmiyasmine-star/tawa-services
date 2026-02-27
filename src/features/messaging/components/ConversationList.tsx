"use client";

// ============================================================
// CONVERSATION LIST COMPONENT
// ============================================================
//
// Renders a list of conversations with:
// - Other user avatar (first letter fallback)
// - Other user name + booking service title
// - Last message preview (prefix "Vous: " if from current user)
// - Relative timestamp (A l'instant, Il y a 5 min, Il y a 2h, Il y a 3j)
// - Unread count badge (blue circle)
// - 5-second polling to refresh conversation list
// - Empty state when no conversations
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  getConversationsAction,
  type ConversationListItem,
} from "@/features/messaging/actions/conversation-queries";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

/**
 * Relative time formatter:
 * - < 1 min → "A l'instant"
 * - < 1 h → "Il y a N min"
 * - < 24 h → "Il y a Nh"
 * - else → "Il y a Nj"
 */
function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  return `Il y a ${diffD}j`;
}

/** Truncate a string to maxLen chars with ellipsis. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

/** Detect whether we're in the provider route group from the current pathname. */
function isProviderPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.includes("/provider/");
}

// ────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────

interface ConversationListProps {
  conversations: ConversationListItem[];
  currentUserId: string;
  /** Optional base path override. Defaults to /messages or /provider/messages. */
  basePath?: string;
}

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────

export function ConversationList({
  conversations: initialConversations,
  currentUserId: _currentUserId,
  basePath,
}: ConversationListProps) {
  const tMessaging = useTranslations("messaging");

  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);

  // Resolve base path for conversation links
  const resolvedBasePath =
    basePath ?? (isProviderPath() ? "/provider/messages" : "/messages");

  // ── 5-second polling ────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getConversationsAction();
      if (!result.success) return;

      const updated = result.data;

      // Only update state if something changed (compare last message id or unread count)
      setConversations((prev) => {
        const hasChanges = updated.some((newConv) => {
          const existing = prev.find((p) => p.id === newConv.id);
          if (!existing) return true;
          if (existing.unreadCount !== newConv.unreadCount) return true;
          if (existing.lastMessage?.content !== newConv.lastMessage?.content)
            return true;
          return false;
        });

        return hasChanges ? updated : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ── Empty state ──────────────────────────────────────────────
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {tMessaging("noConversations")}
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const lastMsg = conv.lastMessage;
        const otherInitial = conv.otherUser.name.charAt(0).toUpperCase();
        const lastMsgPreview = lastMsg
          ? (lastMsg.isFromMe ? "Vous: " : "") +
            truncate(lastMsg.content, 50)
          : null;

        return (
          <Link
            key={conv.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`${resolvedBasePath}/${conv.id}` as any}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                  {otherInitial}
                </AvatarFallback>
              </Avatar>
              {/* Unread badge dot */}
              {conv.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-sm ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
                >
                  {conv.otherUser.name}
                </span>
                {lastMsg && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(new Date(lastMsg.createdAt))}
                  </span>
                )}
              </div>

              {/* Service title */}
              <p className="truncate text-xs text-muted-foreground">
                {conv.booking.serviceTitle}
              </p>

              {/* Last message preview */}
              {lastMsgPreview && (
                <p
                  className={`truncate text-xs ${
                    conv.unreadCount > 0
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {lastMsgPreview}
                </p>
              )}
            </div>

            {/* Unread count badge (alternative: numeric badge on right) */}
            {conv.unreadCount > 0 && (
              <Badge className="ml-auto shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-500">
                {conv.unreadCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}
