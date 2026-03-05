"use client";

// ============================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================
//
// Renders a single chat message bubble:
// - Sent (isFromMe): right-aligned, blue background, white text
// - Received: left-aligned, muted/gray background
// - Below bubble: timestamp in fr-TN format
// - Read receipt on last sent message: "Lu" or "Envoye"
// - Flagged messages show placeholder text instead of content
// - Image messages display as clickable thumbnails
// ============================================================

import { useState } from "react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MessageItem } from "@/features/messaging/actions/conversation-queries";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-TN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────

interface MessageBubbleProps {
  message: MessageItem;
  isFromMe: boolean;
  showReadReceipt: boolean;
}

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────

export function MessageBubble({
  message,
  isFromMe,
  showReadReceipt,
}: MessageBubbleProps) {
  const [imageOpen, setImageOpen] = useState(false);

  return (
    <>
      <div
        className={`flex ${isFromMe ? "justify-end" : "justify-start"} mb-2`}
      >
        <div className={`max-w-[75%] ${isFromMe ? "items-end" : "items-start"} flex flex-col`}>
          {/* Bubble */}
          <div
            className={`px-4 py-2 text-sm break-words ${
              isFromMe
                ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
            }`}
          >
            {message.flagged ? (
              <span className="italic text-opacity-70">
                {isFromMe ? "Message signale" : "Message signale par la moderation"}
              </span>
            ) : (
              <>
                {/* Image thumbnail */}
                {message.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageOpen(true)}
                    className="mb-1 block cursor-pointer overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.imageUrl}
                      alt="Image"
                      className="max-w-[200px] rounded-lg object-cover"
                      loading="lazy"
                    />
                  </button>
                )}
                {/* Text content (skip if image-only with empty/placeholder content) */}
                {message.content && message.content !== "📷 Photo" && (
                  <span>{message.content}</span>
                )}
              </>
            )}
          </div>

          {/* Timestamp + read receipt */}
          <div
            className={`flex items-center gap-1 mt-0.5 ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
          >
            <span className="text-xs text-muted-foreground">
              {formatTime(new Date(message.createdAt))}
            </span>

            {/* Read receipt: only shown on sent messages when showReadReceipt is true */}
            {isFromMe && showReadReceipt && (
              <span
                className={`text-xs ${message.isRead ? "text-blue-400" : "text-muted-foreground"}`}
              >
                {message.isRead ? "Lu" : "Envoye"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full-size image dialog */}
      {message.imageUrl && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 flex items-center justify-center bg-black/90 border-none">
            <VisuallyHidden><DialogTitle>Image</DialogTitle></VisuallyHidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt="Image"
              className="max-w-full max-h-[85vh] rounded object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
