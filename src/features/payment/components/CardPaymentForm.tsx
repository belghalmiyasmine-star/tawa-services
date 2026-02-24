"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { checkoutFormSchema, type CheckoutFormData } from "@/lib/validations/payment";

// ============================================================
// TYPES
// ============================================================

interface CardPaymentFormProps {
  onValidate: (valid: boolean) => void;
  onDataChange?: (data: CheckoutFormData | null) => void;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Formats a raw 16-digit card number string with spaces every 4 digits.
 * e.g. "1234567890123456" -> "1234 5678 9012 3456"
 */
function formatCardDisplay(raw: string): string {
  return raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Strips spaces from a display-formatted card number, keeping only digits.
 */
function stripCardSpaces(formatted: string): string {
  return formatted.replace(/\s/g, "");
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CardPaymentForm — Simulated card input form.
 *
 * - Uses react-hook-form with zodResolver(checkoutFormSchema)
 * - Format-only validation (16 digits, MM/AA, 3-digit CVV)
 * - Reports validity upward via onValidate callback
 * - Reports form data upward via onDataChange callback
 */
export function CardPaymentForm({ onValidate, onDataChange }: CardPaymentFormProps) {
  const t = useTranslations("payment");

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
    mode: "onChange",
  });

  const { formState } = form;

  // Report validity upward whenever form state changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      const result = checkoutFormSchema.safeParse(values);
      onValidate(result.success);
      if (result.success && onDataChange) {
        onDataChange(result.data);
      } else if (onDataChange) {
        onDataChange(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onValidate, onDataChange]);

  return (
    <Form {...form}>
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        {/* Card Number */}
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("card.cardNumber")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("card.placeholder.number")}
                  inputMode="numeric"
                  maxLength={19} /* 16 digits + 3 spaces */
                  value={formatCardDisplay(field.value)}
                  onChange={(e) => {
                    // Only store raw digits
                    const raw = stripCardSpaces(e.target.value).slice(0, 16);
                    field.onChange(raw);
                  }}
                  onBlur={field.onBlur}
                  className="font-mono tracking-widest"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiry and CVV — side by side */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("card.expiry")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("card.placeholder.expiry")}
                    maxLength={5}
                    inputMode="numeric"
                    value={field.value}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9/]/g, "");
                      // Auto-insert slash after MM
                      if (val.length === 2 && field.value.length === 1) {
                        val = val + "/";
                      }
                      field.onChange(val.slice(0, 5));
                    }}
                    onBlur={field.onBlur}
                    className="font-mono"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("card.cvv")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("card.placeholder.cvv")}
                    maxLength={3}
                    type="password"
                    inputMode="numeric"
                    value={field.value}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
                      field.onChange(raw);
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Invisible trigger: keeps errors visible after submit attempt */}
        {formState.isSubmitted && !formState.isValid && (
          <p className="text-xs text-destructive">
            Veuillez corriger les erreurs ci-dessus.
          </p>
        )}
      </div>
    </Form>
  );
}
