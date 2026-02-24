"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { acceptQuoteAction } from "@/features/booking/actions/manage-quotes";
import { PaymentMethodSelector } from "@/features/booking/components/PaymentMethodSelector";
import type { PaymentMethod } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface QuoteAcceptFlowProps {
  quoteId: string;
  proposedPrice: number;
  onAccepted: (bookingId: string) => void;
  onClose: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * QuoteAcceptFlow — Two-step dialog for accepting a quote.
 *
 * Step 1: Select a date for the service
 * Step 2: Select a payment method
 * Confirm: calls acceptQuoteAction({ quoteId, scheduledAt, paymentMethod })
 * On success: navigates to /bookings/[bookingId]
 */
export function QuoteAcceptFlow({
  quoteId,
  proposedPrice,
  onAccepted,
  onClose,
}: QuoteAcceptFlowProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<
    PaymentMethod | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Compute tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0] ?? "";

  function handleNextStep() {
    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "Date requise",
        description: "Veuillez selectionner une date pour le service.",
      });
      return;
    }
    setStep(2);
  }

  async function handleConfirm() {
    if (!selectedPayment) {
      toast({
        variant: "destructive",
        title: "Paiement requis",
        description: "Veuillez selectionner une methode de paiement.",
      });
      return;
    }
    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "Date requise",
        description: "Veuillez selectionner une date pour le service.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build ISO datetime from date string (noon local time)
      const scheduledAt = new Date(`${selectedDate}T12:00:00`).toISOString();

      const result = await acceptQuoteAction({
        quoteId,
        scheduledAt,
        paymentMethod: selectedPayment,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
        return;
      }

      const bookingId = result.data.bookingId;
      onAccepted(bookingId);

      // Navigate to checkout after quote acceptance
      router.push(`/bookings/${bookingId}/checkout` as never);
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez reessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Choisir une date" : t("payment.selectPaymentMethod")}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            className={`font-medium ${step === 1 ? "text-primary" : "text-gray-400"}`}
          >
            1. Date
          </span>
          <span className="text-gray-300">—</span>
          <span
            className={`font-medium ${step === 2 ? "text-primary" : "text-gray-400"}`}
          >
            2. Paiement
          </span>
        </div>

        {/* Summary: proposed price */}
        <div className="rounded-md bg-muted px-4 py-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Prix propose : </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {proposedPrice.toLocaleString("fr-TN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            TND
          </span>
        </div>

        {/* Step 1: Date selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote-accept-date">
                Date souhaitee pour le service{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quote-accept-date"
                type="date"
                min={tomorrowStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleNextStep} className="flex-1">
                Suivant
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment method */}
        {step === 2 && (
          <div className="space-y-4">
            <PaymentMethodSelector
              selected={selectedPayment}
              onSelect={setSelectedPayment}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={isLoading || !selectedPayment}
              >
                {isLoading ? "Confirmation..." : "Confirmer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
