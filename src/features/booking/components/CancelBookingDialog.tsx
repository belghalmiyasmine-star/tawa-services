"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cancelBookingAction } from "@/features/booking/actions/cancel-booking";
import { calculateRefundPercentage } from "@/lib/utils/cancellation";

// ============================================================
// TYPES
// ============================================================

export interface CancelBookingDialogProps {
  bookingId: string;
  /** null for quote-based bookings with no scheduled date yet — gives full refund */
  scheduledAt: Date | null;
  totalAmount: number;
  onCancelled: () => void;
  onClose: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CancelBookingDialog — AlertDialog for client-initiated booking cancellation.
 *
 * Displays refund tier (100%/50%/0%) calculated from scheduledAt before confirmation.
 * Calls cancelBookingAction on confirm.
 */
export function CancelBookingDialog({
  bookingId,
  scheduledAt,
  totalAmount,
  onCancelled,
  onClose,
}: CancelBookingDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate refund tier client-side (pure function — no side effects)
  const refund = scheduledAt
    ? calculateRefundPercentage(new Date(scheduledAt))
    : { tier: "FULL" as const, refundPercentage: 100, hoursUntilScheduled: Infinity };

  const refundAmount = (totalAmount * refund.refundPercentage) / 100;

  // Refund info card styling per tier
  const refundConfig = {
    FULL: {
      containerClass: "rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-950 dark:border-green-800",
      textClass: "text-green-800 dark:text-green-200",
      label: `Remboursement integral : ${refundAmount.toFixed(2)} TND`,
    },
    PARTIAL: {
      containerClass: "rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950 dark:border-amber-800",
      textClass: "text-amber-800 dark:text-amber-200",
      label: `Remboursement partiel : ${refundAmount.toFixed(2)} TND (50% — ${Math.round(refund.hoursUntilScheduled)}h avant le rendez-vous)`,
    },
    NONE: {
      containerClass: "rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950 dark:border-red-800",
      textClass: "text-red-800 dark:text-red-200",
      label: `Aucun remboursement (${Math.round(refund.hoursUntilScheduled)}h avant le rendez-vous)`,
    },
  }[refund.tier];

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const result = await cancelBookingAction({
        bookingId,
        reason: reason.trim() || undefined,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
        return;
      }

      toast({
        title: "Reservation annulee",
        description:
          result.data.refund.refundPercentage > 0
            ? `Remboursement de ${result.data.refund.refundAmount.toFixed(2)} TND en cours de traitement.`
            : "Aucun remboursement selon la politique d'annulation.",
      });

      onCancelled();
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la reservation</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {/* Refund info card */}
              <div className={refundConfig.containerClass}>
                <p className={`text-sm font-medium ${refundConfig.textClass}`}>
                  {refundConfig.label}
                </p>
              </div>

              {/* Reason textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cancel-reason"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Raison de l&apos;annulation (optionnel)
                </label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Expliquez la raison de votre annulation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Warning */}
              <p className="text-xs font-medium text-destructive">
                Cette action est irreversible.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Garder la reservation
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Annulation..." : "Confirmer l'annulation"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
