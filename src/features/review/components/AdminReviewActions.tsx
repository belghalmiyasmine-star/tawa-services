"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/features/review/actions/review-actions";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// TYPES
// ============================================================

interface AdminReviewActionsProps {
  reviewId: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Client wrapper for admin review moderation buttons (Approuver / Supprimer).
 * Calls moderateReviewAction server action and refreshes the page on success.
 */
export function AdminReviewActions({ reviewId }: AdminReviewActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleModerate = async (action: "approve" | "reject") => {
    if (action === "approve") {
      setApproving(true);
    } else {
      setRejecting(true);
    }

    try {
      const result = await moderateReviewAction(reviewId, action);
      if (result.success) {
        toast({
          title:
            action === "approve"
              ? "Avis approuve"
              : "Avis supprime",
          description:
            action === "approve"
              ? "L'avis a ete approuve et le signalement supprime."
              : "L'avis a ete supprime et le classement du prestataire recalcule.",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
      }
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  };

  const isLoading = approving || rejecting;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
        disabled={isLoading}
        onClick={() => handleModerate("approve")}
      >
        {approving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="mr-1.5 h-3.5 w-3.5" />
        )}
        Approuver
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
        disabled={isLoading}
        onClick={() => handleModerate("reject")}
      >
        {rejecting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        )}
        Supprimer
      </Button>
    </div>
  );
}
