"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
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
 *
 * - FIXED services: "Reserver" coming-soon toast (Plan 03 will wire it to /book)
 * - SUR_DEVIS services: "Demander un devis" navigates to /services/[id]/quote (Plan 04)
 * - "Contacter" is always a coming-soon toast (Phase 9 messaging)
 */
export function ServiceDetailClient({
  serviceId,
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
      {pricingType === "SUR_DEVIS" ? (
        <Button className="w-full" asChild>
          <Link href={`/services/${serviceId}/quote` as never}>
            {t("buttonDevis")}
          </Link>
        </Button>
      ) : (
        <Button className="w-full" onClick={handleComingSoon}>
          {t("buttonReserve")}
        </Button>
      )}

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
