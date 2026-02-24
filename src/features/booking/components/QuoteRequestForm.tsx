"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createQuoteAction } from "@/features/booking/actions/manage-quotes";

// ============================================================
// SCHEMA (client-side, mirrors server createQuoteSchema)
// ============================================================

const quoteRequestFormSchema = z.object({
  description: z
    .string()
    .min(50, "La description doit contenir au moins 50 caracteres")
    .max(2000, "La description ne peut pas depasser 2000 caracteres"),
  preferredDate: z.string().optional(),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres")
    .max(200, "L'adresse ne peut pas depasser 200 caracteres"),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres")
    .max(100, "La ville ne peut pas depasser 100 caracteres"),
  budget: z.string().optional(),
});

type QuoteRequestFormValues = z.infer<typeof quoteRequestFormSchema>;

// ============================================================
// TYPES
// ============================================================

interface QuoteRequestFormProps {
  service: {
    id: string;
    title: string;
    fixedPrice: number | null;
    pricingType: "FIXED" | "SUR_DEVIS";
    provider: {
      displayName: string;
      photoUrl: string | null;
    };
  };
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * QuoteRequestForm — Form for client to request a quote for a SUR_DEVIS service.
 *
 * - Validates description (min 50 chars) with live character counter
 * - Optional preferred date (min: tomorrow)
 * - Required address and city
 * - Optional budget
 * - Calls createQuoteAction on submit
 * - On success: toast + redirect to /bookings
 */
export function QuoteRequestForm({ service }: QuoteRequestFormProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuoteRequestFormValues>({
    resolver: zodResolver(quoteRequestFormSchema),
    defaultValues: {
      description: "",
      preferredDate: "",
      address: "",
      city: "",
      budget: "",
    },
  });

  const descriptionValue = form.watch("description");
  const descriptionLength = descriptionValue?.length ?? 0;

  // Compute tomorrow as min date for preferredDate
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0] ?? "";

  async function onSubmit(values: QuoteRequestFormValues) {
    setIsLoading(true);
    try {
      const budgetNum = values.budget ? parseFloat(values.budget) : undefined;
      const preferredDateISO = values.preferredDate
        ? new Date(values.preferredDate).toISOString()
        : undefined;

      const result = await createQuoteAction({
        serviceId: service.id,
        description: values.description,
        preferredDate: preferredDateISO,
        address: values.address,
        city: values.city,
        budget: budgetNum && !isNaN(budgetNum) ? budgetNum : undefined,
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
        title: t("quoteSubmitted"),
        description:
          "Votre demande de devis a ete envoyee. Le prestataire a 48h pour repondre.",
      });

      router.push("/bookings" as never);
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
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      {/* Service summary card */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage
              src={service.provider.photoUrl ?? undefined}
              alt={service.provider.displayName}
            />
            <AvatarFallback>
              {service.provider.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {service.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {service.provider.displayName}
            </p>
          </div>
          <Badge variant="secondary">Sur devis</Badge>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("quote.describeNeed")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Decrivez votre besoin en detail (ex: surface a nettoyer, type de materiau, contraintes particulieres...)"
                    rows={5}
                    className="resize-none"
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormMessage />
                  <p
                    className={`text-xs ${
                      descriptionLength < 50
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {descriptionLength} / {t("quote.minCharsDescription")}
                  </p>
                </div>
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Adresse du service{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Numero et nom de rue"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Ville <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Tunis, Sfax, Sousse..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preferred date (optional) */}
          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("quote.preferredDate")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    min={tomorrowStr}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget (optional) */}
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("quote.optionalBudget")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optionnel"
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      TND
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Envoi en cours..." : t("quote.submitQuoteRequest")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
