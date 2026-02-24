"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle } from "lucide-react";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PaymentMethod } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface PaymentConfirmationProps {
  referenceNumber: string;
  amount: number;
  serviceTitle: string;
  paymentMethod: PaymentMethod;
  bookingId: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "Carte bancaire",
  D17: "D17 (Poste tunisienne)",
  FLOUCI: "Flouci",
  CASH: "Especes (paiement a la prestation)",
};

// ============================================================
// COMPONENT
// ============================================================

/**
 * PaymentConfirmation — Displays payment success details.
 *
 * - Large green CheckCircle success icon
 * - Demo banner (same amber style as checkout)
 * - Reference number in monospace font
 * - Payment summary (service, amount, method)
 * - Navigation links to /bookings and /bookings/[bookingId]
 */
export function PaymentConfirmation({
  referenceNumber,
  amount,
  serviceTitle,
  paymentMethod,
  bookingId,
}: PaymentConfirmationProps) {
  const t = useTranslations("payment");

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      {/* Success icon */}
      <div className="mb-6 flex justify-center">
        <CheckCircle className="h-20 w-20 text-green-500" />
      </div>

      {/* Title */}
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
        {t("confirmation.title")}
      </h1>

      {/* Demo banner */}
      <div className="mb-6 flex items-start gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{t("checkout.demoBanner")}</span>
      </div>

      {/* Reference number card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("confirmation.reference")}
          </p>
          <p className="break-all font-mono text-lg font-semibold tracking-wider text-foreground">
            {referenceNumber}
          </p>
        </CardContent>
      </Card>

      {/* Payment summary */}
      <Card className="mb-8">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">{serviceTitle}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Montant paye</span>
            <span className="font-semibold text-foreground">
              {amount.toFixed(2)} TND
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Methode de paiement</span>
            <span className="text-foreground">
              {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/bookings">{t("confirmation.backToBookings")}</Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href={`/bookings/${bookingId}` as never}>
            Voir le detail
          </Link>
        </Button>
      </div>
    </div>
  );
}
