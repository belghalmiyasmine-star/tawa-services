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
// - Supports image upload via paperclip button
// ============================================================

import { useRef, useState } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
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
  onMessageSent: (content: string, imageUrl?: string) => void;
}

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

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

  // ── Image selection ────────────────────────────────────────
  function handleImageClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        description: tMessaging("imageTooLarge"),
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
  }

  function clearPendingImage() {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }
  }

  // ── Upload image to server ─────────────────────────────────
  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        return result.data.imageUrl as string;
      }

      toast({
        variant: "destructive",
        description: result.error ?? tMessaging("errors.uploadFailed"),
      });
      return null;
    } catch {
      toast({
        variant: "destructive",
        description: tMessaging("errors.uploadFailed"),
      });
      return null;
    }
  }

  // ── Send handler ───────────────────────────────────────────
  async function handleSend() {
    const content = inputValue.trim();
    const hasImage = !!pendingImage;

    if (!content && !hasImage) return;
    if (isSending || isUploading) return;

    setIsSending(true);

    try {
      let imageUrl: string | undefined;

      // Upload image first if present
      if (pendingImage) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(pendingImage.file);
        setIsUploading(false);

        if (!uploadedUrl) {
          setIsSending(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      // Use placeholder content for image-only messages
      const messageContent = content || (imageUrl ? "📷 Photo" : "");

      const result = await sendMessageAction({
        conversationId,
        content: messageContent,
        imageUrl,
      });

      if (result.success) {
        setInputValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        clearPendingImage();
        onMessageSent(messageContent, imageUrl);
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
      setIsUploading(false);
    }
  }

  const canSend = (inputValue.trim() || pendingImage) && !isSending && !isUploading;

  return (
    <div className="border-t bg-background p-3">
      {/* Image preview */}
      {pendingImage && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.previewUrl}
              alt="Aperçu"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearPendingImage}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
              aria-label={tMessaging("removeImage")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image upload button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleImageClick}
          disabled={isSending || isUploading}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={tMessaging("attachImage")}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />

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
          disabled={!canSend}
          className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600"
          aria-label={tMessaging("sendMessage")}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
