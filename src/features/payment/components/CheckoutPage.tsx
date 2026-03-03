"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodSelector } from "@/features/booking/components/PaymentMethodSelector";
import { CardPaymentForm } from "@/features/payment/components/CardPaymentForm";
import { processPaymentAction } from "@/features/payment/actions/payment-actions";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface CheckoutPageProps {
  bookingId: string;
  amount: number;
  serviceTitle: string;
  servicePrice: number;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CheckoutPage — Client component for the booking checkout flow.
 *
 * - Demo banner: amber bg indicating simulated payment mode
 * - Order summary: service price + platform fee + total in TND
 * - 4 payment methods: CARD (with form), D17/FLOUCI (one-click), CASH (info text)
 * - Calls processPaymentAction on submit, redirects to confirmation on success
 */
export function CheckoutPage({
  bookingId,
  amount,
  serviceTitle,
  servicePrice,
}: CheckoutPageProps) {
  const t = useTranslations("payment");
  const router = useRouter();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardValid, setIsCardValid] = useState(false);

  // Platform fee = 5% of total (display only)
  const platformFee = amount * 0.05;

  // Can pay if method is selected and (not CARD, or CARD is valid)
  const canPay =
    selectedMethod !== null &&
    (selectedMethod !== "CARD" || isCardValid) &&
    !isProcessing;

  async function handlePay() {
    if (!selectedMethod) return;

    setIsProcessing(true);

    try {
      const result = await processPaymentAction({
        bookingId,
        paymentMethod: selectedMethod,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur de paiement",
          description: result.error ?? "Une erreur est survenue",
        });
        setIsProcessing(false);
        return;
      }

      // If gateway returned a payment URL, redirect to external payment page
      if (result.data.payUrl) {
        window.location.href = result.data.payUrl;
        return;
      }

      // Otherwise (cash or simulated), navigate to confirmation page
      router.push(
        `/bookings/${bookingId}/confirmation?ref=${result.data.referenceNumber}` as never,
      );
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
      });
      setIsProcessing(false);
    }
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      {/* Page title */}
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("checkout.title")}
      </h1>

      {/* Demo banner */}
      <div className="mb-6 flex items-start gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{t("checkout.demoBanner")}</span>
      </div>

      {/* Order summary card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{serviceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("checkout.servicePrice")}</span>
            <span className="text-foreground">{servicePrice.toFixed(2)} TND</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
            <span className="text-foreground">{platformFee.toFixed(2)} TND</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>{t("checkout.total")}</span>
            <span>{amount.toFixed(2)} TND</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment method selection */}
      <div className="mb-6">
        <PaymentMethodSelector
          selected={selectedMethod ?? undefined}
          onSelect={(method) => setSelectedMethod(method)}
        />
      </div>

      {/* Method-specific UI */}
      {selectedMethod === "CARD" && (
        <div className="mb-6">
          <CardPaymentForm onValidate={setIsCardValid} />
        </div>
      )}

      {selectedMethod === "D17" && (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-center">
          <p className="mb-3 text-sm font-medium text-foreground">
            Paiement via D17
          </p>
          <p className="text-xs text-muted-foreground">
            Cliquez sur &quot;Payer maintenant&quot; pour simuler le paiement D17.
          </p>
        </div>
      )}

      {selectedMethod === "FLOUCI" && (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-center">
          <p className="mb-3 text-sm font-medium text-foreground">
            Paiement via Flouci
          </p>
          <p className="text-xs text-muted-foreground">
            Cliquez sur &quot;Payer maintenant&quot; pour simuler le paiement Flouci.
          </p>
        </div>
      )}

      {selectedMethod === "CASH" && (
        <div className="mb-6 rounded-lg border bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Le paiement sera effectue en especes lors de la prestation.
        </div>
      )}

      {/* Pay button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!canPay}
        onClick={handlePay}
      >
        {isProcessing ? t("checkout.processing") : t("checkout.payNow")}
      </Button>
    </div>
  );
}
