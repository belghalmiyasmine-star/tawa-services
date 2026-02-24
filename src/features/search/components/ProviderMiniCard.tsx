import { Star, MapPin, CheckCircle2 } from "lucide-react";

import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

// ============================================================
// TYPES
// ============================================================

interface ProviderMiniCardProps {
  provider: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    rating: number;
    ratingCount: number;
    kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
    delegations: Array<{
      delegation: {
        gouvernorat: {
          name: string;
        };
      };
    }>;
    trustBadges?: { badgeType: string; isActive: boolean }[];
  };
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ProviderMiniCard — Server component displaying provider summary on service detail page.
 * Shows avatar, name, rating, city, verified badge, trust badges, and link to provider profile.
 */
export async function ProviderMiniCard({ provider }: ProviderMiniCardProps) {
  const t = await getTranslations("search");

  const city =
    provider.delegations.length > 0
      ? provider.delegations[0]?.delegation.gouvernorat.name ?? null
      : null;

  const isVerified = provider.kycStatus === "APPROVED";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Avatar + Name + Rating */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {provider.photoUrl ? (
            <img
              src={provider.photoUrl}
              alt={provider.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                {provider.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name + Rating + Verified */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-gray-900 dark:text-gray-100">
              {provider.displayName}
            </span>
            {isVerified && (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-green-500"
                aria-label={t("verifiedBadge")}
              />
            )}
          </div>

          {/* Stars + review count */}
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {provider.rating.toFixed(1)}
            </span>
            {provider.ratingCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({provider.ratingCount})
              </span>
            )}
          </div>

          {/* City */}
          {city && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trust badges row */}
      {provider.trustBadges && provider.trustBadges.filter((b) => b.isActive).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.trustBadges
            .filter((b) => b.isActive)
            .map((badge) => (
              <span
                key={badge.badgeType}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {badge.badgeType === "IDENTITY_VERIFIED" && "Identite Verifiee"}
                {badge.badgeType === "QUICK_RESPONSE" && "Reponse Rapide"}
                {badge.badgeType === "TOP_PROVIDER" && "Top Prestataire"}
              </span>
            ))}
        </div>
      )}

      {/* View profile link */}
      <div className="mt-3">
        <Link
          href={`/providers/${provider.id}` as never}
          className="block w-full rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("viewProfile")}
        </Link>
      </div>
    </div>
  );
}
