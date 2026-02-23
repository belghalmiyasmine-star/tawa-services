import { Heart, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";

// ============================================================
// TYPES
// ============================================================

interface PublicServiceCardProps {
  service: {
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
}

// ============================================================
// HELPERS
// ============================================================

function formatPrice(pricingType: "FIXED" | "SUR_DEVIS", fixedPrice: number | null): string {
  if (pricingType === "SUR_DEVIS") return "Sur devis";
  if (fixedPrice === null) return "Sur devis";
  return `${fixedPrice.toLocaleString("fr-TN")} TND`;
}

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours}h`;
  return `${hours}h${rem}min`;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * PublicServiceCard — Airbnb-style service card for the public provider profile.
 * Displays provider info (name, avatar, rating, city) on the card.
 * Server component — no "use client".
 */
export function PublicServiceCard({ service }: PublicServiceCardProps) {
  const city =
    service.provider.delegations.length > 0
      ? service.provider.delegations[0]?.delegation.gouvernorat.name
      : null;

  const firstPhoto = service.photoUrls[0] ?? null;

  const categoryLabel =
    service.category.parent
      ? service.category.name
      : service.category.name;

  const duration = formatDuration(service.durationMinutes);

  return (
    // Service detail page is built in Phase 5 — card links to # for now
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Top: photo or gradient placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={service.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl text-teal-300">🛠</span>
          </div>
        )}
        {/* Favorite heart icon — visual placeholder only */}
        {/* Heart icon — visual placeholder for Phase 6 favorites feature */}
        <div
          aria-label="Ajouter aux favoris"
          className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:bg-gray-800/80"
        >
          <Heart className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category badge */}
        <div>
          <Badge
            variant="secondary"
            className="text-xs font-normal"
          >
            {categoryLabel}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
          {service.title}
        </h3>

        {/* Provider mini-section */}
        <div className="flex items-center gap-2">
          {service.provider.photoUrl ? (
            <img
              src={service.provider.photoUrl}
              alt={service.provider.displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {service.provider.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
              {service.provider.displayName}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {service.provider.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* City */}
        {city && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            📍 {city}
          </p>
        )}

        {/* Price + duration */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatPrice(service.pricingType, service.fixedPrice)}
          </span>
          {duration && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
