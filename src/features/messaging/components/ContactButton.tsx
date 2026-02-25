"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getOrCreateConversationAction } from "@/features/messaging/actions/conversation-queries";

// ============================================================
// CONTACT BUTTON — creates or opens conversation for a booking
// ============================================================

interface ContactButtonProps {
  /** The booking ID to create/open a conversation for */
  bookingId: string;
  /** Button label e.g. "Contacter le prestataire" or "Contacter le client" */
  label: string;
  /** Base path for the messages route: "/messages" or "/provider/messages" */
  basePath: string;
}

/**
 * Client component that creates (or retrieves) a conversation for a booking
 * and navigates to the chat page.
 *
 * Used on both client and provider booking detail pages.
 */
export function ContactButton({ bookingId, label, basePath }: ContactButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const result = await getOrCreateConversationAction(bookingId);
      if (result.success) {
        router.push(`${basePath}/${result.data.conversationId}` as never);
      }
    } catch {
      // Silently handle error — user stays on page
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={() => void handleClick()}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      <span>{isLoading ? "Chargement..." : label}</span>
    </Button>
  );
}
