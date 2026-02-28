"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";
import { findConversationWithProviderAction } from "@/features/messaging/actions/conversation-queries";

interface ContactProviderButtonProps {
  providerId: string;
  label?: string;
  variant?: "default" | "outline";
  className?: string;
}

/**
 * Button to contact a provider.
 * - If user has an existing conversation with the provider, navigates to it.
 * - If not, shows a toast suggesting to book first.
 */
export function ContactProviderButton({
  providerId,
  label = "Contacter",
  variant = "outline",
  className,
}: ContactProviderButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const result = await findConversationWithProviderAction(providerId);

      if (result.success && result.data.conversationId) {
        router.push(`/messages/${result.data.conversationId}` as never);
      } else {
        toast({
          title: "Aucune conversation",
          description:
            "Reservez un service pour pouvoir contacter ce prestataire.",
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la conversation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => void handleClick()}
      disabled={isLoading}
    >
      <MessageSquare className="mr-2 h-4 w-4" />
      {isLoading ? "Chargement..." : label}
    </Button>
  );
}
