"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Banknote, Smartphone, Wallet, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  selected?: PaymentMethod;
}

// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_METHODS: {
  method: PaymentMethod;
  icon: React.ReactNode;
}[] = [
  {
    method: "CARD",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    method: "D17",
    icon: <Banknote className="h-6 w-6" />,
  },
  {
    method: "FLOUCI",
    icon: <Smartphone className="h-6 w-6" />,
  },
  {
    method: "CASH",
    icon: <Wallet className="h-6 w-6" />,
  },
];

// ============================================================
// COMPONENT
// ============================================================

/**
 * PaymentMethodSelector — 4 payment method cards with demo banner.
 *
 * Used in QuoteAcceptFlow (Plan 04) and BookingWizard Step 3 (Plan 03).
 */
export function PaymentMethodSelector({
  onSelect,
  selected,
}: PaymentMethodSelectorProps) {
  const t = useTranslations("payment");

  return (
    <div className="space-y-4">
      {/* Demo mode banner */}
      <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        {t("method.CARD") && null /* load namespace */}
        Mode demonstration — aucun paiement reel ne sera effectue
      </div>

      {/* Payment method grid: 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map(({ method, icon }) => {
          const isSelected = selected === method;
          return (
            <Card
              key={method}
              className={cn(
                "relative cursor-pointer p-4 transition-all hover:shadow-md",
                isSelected
                  ? "border-2 border-primary shadow-sm"
                  : "border hover:border-gray-300",
              )}
              onClick={() => onSelect(method)}
            >
              {isSelected && (
                <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
              )}
              <div className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "transition-colors",
                    isSelected ? "text-primary" : "text-gray-600 dark:text-gray-400",
                  )}
                >
                  {icon}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t(`method.${method}`)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
