"use client";

// ============================================================
// CHAT VIEW COMPONENT
// ============================================================
//
// Displays the full message history for a conversation:
// - Initial load fetches 30 messages (newest-first → reversed for display)
// - 5-second polling for new messages (setInterval)
// - Auto-scroll to bottom on load and when new messages arrive
//   (only if user was already near the bottom)
// - Load older messages via "Charger les messages precedents" button
// - Messages grouped by date label (Aujourd'hui, Hier, or full date)
// - Read receipts via markMessagesAsReadAction on mount + new messages
// - Optimistic updates via imperative handle (addOptimisticMessage)
// ============================================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  getConversationMessagesAction,
  type MessageItem,
} from "@/features/messaging/actions/conversation-queries";
import { markMessagesAsReadAction } from "@/features/messaging/actions/message-actions";
import { MessageBubble } from "./MessageBubble";

// ────────────────────────────────────────────────
// IMPERATIVE HANDLE TYPE
// ────────────────────────────────────────────────

export interface ChatViewHandle {
  addOptimisticMessage: (content: string) => void;
}

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

/** Formats a date for grouping headers. */
function getDateLabel(
  date: Date,
  tMessaging: ReturnType<typeof useTranslations>,
): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const normalize = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  if (normalize(date) === normalize(today)) {
    return tMessaging("today");
  }
  if (normalize(date) === normalize(yesterday)) {
    return tMessaging("yesterday");
  }

  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Groups messages by calendar date, returning an array of
 * { label, messages } buckets in chronological order.
 */
function groupByDate(
  messages: MessageItem[],
  tMessaging: ReturnType<typeof useTranslations>,
): Array<{ label: string; messages: MessageItem[] }> {
  const groups: Array<{ label: string; messages: MessageItem[] }> = [];
  let currentLabel = "";
  let currentGroup: MessageItem[] = [];

  for (const msg of messages) {
    const label = getDateLabel(new Date(msg.createdAt), tMessaging);
    if (label !== currentLabel) {
      if (currentGroup.length > 0) {
        groups.push({ label: currentLabel, messages: currentGroup });
      }
      currentLabel = label;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ label: currentLabel, messages: currentGroup });
  }

  return groups;
}

// ────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
}

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────

export const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(
  function ChatView({ conversationId, currentUserId }, ref) {
    const tMessaging = useTranslations("messaging");
    const tCommon = useTranslations("common");

    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [oldestCursor, setOldestCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Track the newest message id we've seen (for polling comparison)
    const newestIdRef = useRef<string | null>(null);

    // ── Auto-scroll helpers ─────────────────────────────────────

    function isNearBottom(): boolean {
      const el = containerRef.current;
      if (!el) return true;
      return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }

    function scrollToBottom(smooth = false) {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }

    // ── Initial load ────────────────────────────────────────────

    const loadInitialMessages = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      const result = await getConversationMessagesAction({
        conversationId,
        limit: 30,
      });

      if (result.success) {
        const fetched = result.data.messages;
        setMessages(fetched);
        setHasMore(result.data.nextCursor !== null);
        setOldestCursor(result.data.nextCursor);

        // Track newest for polling
        newestIdRef.current = fetched.at(-1)?.id ?? null;

        // Mark messages from other user as read
        void markMessagesAsReadAction(conversationId);
      } else {
        setError(tMessaging("errors.loadFailed"));
      }

      setIsLoading(false);
    }, [conversationId, tMessaging]);

    useEffect(() => {
      void loadInitialMessages();
    }, [loadInitialMessages]);

    // ── Scroll to bottom after initial load ──────────────────────
    useEffect(() => {
      if (!isLoading && messages.length > 0) {
        scrollToBottom();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    // ── 5-second polling ─────────────────────────────────────────
    useEffect(() => {
      const interval = setInterval(async () => {
        const result = await getConversationMessagesAction({
          conversationId,
          limit: 30,
        });

        if (!result.success) return;

        const fetched = result.data.messages;
        if (fetched.length === 0) return;

        const latestId = fetched.at(-1)?.id;
        if (latestId === newestIdRef.current) return; // No new messages

        // Find genuinely new messages (IDs not in our current state)
        setMessages((prev) => {
          // Separate real and optimistic messages
          const realPrev = prev.filter((m) => !m.id.startsWith("optimistic-"));
          const existingIds = new Set(realPrev.map((m) => m.id));
          const newMessages = fetched.filter((m) => !existingIds.has(m.id));

          // Also update read status for existing messages
          const updatedPrev = realPrev.map((m) => {
            const refreshed = fetched.find((f) => f.id === m.id);
            return refreshed ?? m;
          });

          if (newMessages.length === 0) return updatedPrev;

          const hasNewFromOther = newMessages.some(
            (m) => m.senderId !== currentUserId,
          );

          // Mark as read if new messages from the other user
          if (hasNewFromOther) {
            void markMessagesAsReadAction(conversationId);
          }

          // Update newestIdRef
          newestIdRef.current = fetched.at(-1)?.id ?? newestIdRef.current;

          return [...updatedPrev, ...newMessages];
        });
      }, 5000);

      return () => clearInterval(interval);
    }, [conversationId, currentUserId]);

    // ── Auto-scroll when messages change (if near bottom) ────────
    useEffect(() => {
      if (!isLoading && isNearBottom()) {
        scrollToBottom(true);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    // ── Load older messages ──────────────────────────────────────
    async function loadOlderMessages() {
      if (!hasMore || !oldestCursor || isLoadingMore) return;

      setIsLoadingMore(true);

      const result = await getConversationMessagesAction({
        conversationId,
        cursor: oldestCursor,
        limit: 30,
      });

      if (result.success) {
        setMessages((prev) => [...result.data.messages, ...prev]);
        setHasMore(result.data.nextCursor !== null);
        setOldestCursor(result.data.nextCursor);
      }

      setIsLoadingMore(false);
    }

    // ── Optimistic message (imperative handle) ────────────────────
    useImperativeHandle(ref, () => ({
      addOptimisticMessage(content: string) {
        const optimisticMsg: MessageItem = {
          id: `optimistic-${Date.now()}`,
          senderId: currentUserId,
          senderName: "Vous",
          content,
          createdAt: new Date(),
          isRead: false,
          readAt: null,
          flagged: false,
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        newestIdRef.current = optimisticMsg.id;
      },
    }));

    // ── Derived data ─────────────────────────────────────────────
    const dateGroups = groupByDate(messages, tMessaging);

    // Index of the last sent message (for read receipt display)
    let lastSentIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.senderId === currentUserId) {
        lastSentIndex = i;
        break;
      }
    }

    // ── Render ────────────────────────────────────────────────────

    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadInitialMessages()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {/* Load older messages button */}
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void loadOlderMessages()}
              disabled={isLoadingMore}
              className="text-xs text-muted-foreground"
            >
              {isLoadingMore ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              {tMessaging("loadMore")}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {tMessaging("noMessages")}
            </p>
          </div>
        )}

        {/* Message groups */}
        {dateGroups.map((group) => (
          <div key={group.label}>
            {/* Date separator */}
            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Messages in this date group */}
            {group.messages.map((msg) => {
              const msgIndex = messages.findIndex((m) => m.id === msg.id);
              const isFromMe = msg.senderId === currentUserId;
              const showReadReceipt = isFromMe && msgIndex === lastSentIndex;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFromMe={isFromMe}
                  showReadReceipt={showReadReceipt}
                />
              );
            })}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);
