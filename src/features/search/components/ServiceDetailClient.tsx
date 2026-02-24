"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// TYPES
// ============================================================

interface ServiceDetailClientProps {
  serviceId: string;
  pricingType: "FIXED" | "SUR_DEVIS";
  providerId: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ServiceDetailClient — Client wrapper for interactive action buttons on service detail page.
 * Shows "Reserver" or "Demander un devis" based on pricingType + a "Contacter" outline button.
 * All buttons trigger a "coming soon" toast (Phase 6 booking, Phase 9 messaging).
 */
export function ServiceDetailClient({
  serviceId: _serviceId,
  pricingType,
  providerId: _providerId,
}: ServiceDetailClientProps) {
  const t = useTranslations("search");
  const { toast } = useToast();

  function handleComingSoon() {
    toast({
      title: t("comingSoonToast"),
      description: "Cette fonctionnalite sera disponible dans une prochaine mise a jour.",
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Primary CTA */}
      <Button
        className="w-full"
        onClick={handleComingSoon}
      >
        {pricingType === "FIXED" ? t("buttonReserve") : t("buttonDevis")}
      </Button>

      {/* Secondary: Contact */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleComingSoon}
      >
        {t("buttonContact")}
      </Button>
    </div>
  );
}
