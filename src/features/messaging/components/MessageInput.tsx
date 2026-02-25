"use client";

// ============================================================
// MESSAGE INPUT COMPONENT
// ============================================================
//
// Textarea + Send button for composing and sending messages.
// - Handles Enter (send) vs Shift+Enter (newline)
// - Shows contact-info-blocked toast on moderation block
// - Calls sendMessageAction on submit
// - Notifies parent via onMessageSent callback on success
// ============================================================

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMessageAction } from "@/features/messaging/actions/message-actions";

// ────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (content: string) => void;
}

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────

export function MessageInput({
  conversationId,
  onMessageSent,
}: MessageInputProps) {
  const tMessaging = useTranslations("messaging");
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ── Auto-resize textarea (max 3 lines) ─────────────────────
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);

    // Reset height, then shrink-to-fit, then cap at 3 lines (~72px)
    const el = e.target;
    el.style.height = "auto";
    const maxHeight = 72; // approx 3 lines × 24px line-height
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }

  // ── Submit on Enter (not Shift+Enter) ──────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // ── Send handler ───────────────────────────────────────────
  async function handleSend() {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setIsSending(true);

    try {
      const result = await sendMessageAction({ conversationId, content });

      if (result.success) {
        setInputValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        onMessageSent(content);
      } else if (result.error === "contact_info_blocked") {
        toast({
          variant: "destructive",
          title: tMessaging("contactInfoBlockedTitle"),
          description: tMessaging("contactInfoBlocked"),
        });
      } else {
        toast({
          variant: "destructive",
          description: tMessaging("errors.sendFailed"),
        });
      }
    } catch {
      toast({
        variant: "destructive",
        description: tMessaging("errors.sendFailed"),
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={tMessaging("typeMessage")}
          rows={1}
          className="min-h-[40px] resize-none overflow-hidden py-2 text-sm"
          disabled={isSending}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void handleSend()}
          disabled={!inputValue.trim() || isSending}
          className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600"
          aria-label={tMessaging("sendMessage")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
