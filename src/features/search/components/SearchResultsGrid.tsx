import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PublicServiceCard } from "@/features/provider/components/PublicServiceCard";

// ============================================================
// TYPES
// ============================================================

// Service shape matches PublicServiceCard's expected props
type ServiceForCard = {
  id: string;
  title: string;
  description: string;
  pricingType: "FIXED" | "SUR_DEVIS";
  fixedPrice: number | null;
  durationMinutes: number | null;
  photoUrls: string[];
  category: {
    name: string;
    parent: { name: string } | null;
  };
  provider: {
    displayName: string;
    photoUrl: string | null;
    rating: number;
    ratingCount: number;
    delegations: Array<{
      delegation: {
        gouvernorat: {
          name: string;
        };
      };
    }>;
  };
};

interface SearchResultsGridProps {
  services: ServiceForCard[];
  total: number;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * SearchResultsGrid — Server component rendering a grid of PublicServiceCard.
 * Shows result count at top. Shows empty state when no results.
 * Grid: 1-col mobile, 2-col sm, 3-col lg.
 */
export async function SearchResultsGrid({ services, total }: SearchResultsGridProps) {
  const t = await getTranslations("search");

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
        <SearchX className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
          {t("noResults")}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("noResultsDescription")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Result count */}
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {t("resultsCount", { count: total })}
      </p>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <PublicServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
