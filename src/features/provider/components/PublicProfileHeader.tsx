import { UserCircle } from "lucide-react";
import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { TrustBadges } from "@/components/shared/TrustBadges";

// ============================================================
// TYPES
// ============================================================

interface PublicProfileHeaderProps {
  provider: {
    displayName: string;
    photoUrl: string | null;
    kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
    rating: number;
    ratingCount: number;
    createdAt: Date;
    delegations: Array<{
      delegation: {
        gouvernorat: {
          name: string;
        };
      };
    }>;
  };
  badges: { badgeType: string; isActive: boolean }[];
}

// ============================================================
// HELPERS
// ============================================================

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
        />
      ))}
      {hasHalf && (
        <Star className="h-4 w-4 fill-yellow-200 text-yellow-400" />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
    </div>
  );
}

function formatMemberSince(date: Date, monthLabel: string): string {
  const months = [
    "janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${monthLabel} ${month} ${year}`;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * PublicProfileHeader — Airbnb-style provider profile hero section.
 * Server component — no "use client".
 */
export async function PublicProfileHeader({
  provider,
  badges,
}: PublicProfileHeaderProps) {
  const t = await getTranslations("provider");

  // Derive city from first delegation's gouvernorat
  const city =
    provider.delegations.length > 0
      ? provider.delegations[0]?.delegation.gouvernorat.name
      : "Tunisie";

  const memberSince = formatMemberSince(new Date(provider.createdAt), t("memberSince"));

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
      {/* Avatar */}
      <div className="shrink-0">
        {provider.photoUrl ? (
          <img
            src={provider.photoUrl}
            alt={provider.displayName}
            className="h-[120px] w-[120px] rounded-full border-4 border-white object-cover shadow-md sm:h-[160px] sm:w-[160px]"
          />
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-white bg-gray-100 shadow-md sm:h-[160px] sm:w-[160px]">
            <UserCircle className="h-20 w-20 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2">
        {/* Display name */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {provider.displayName}
        </h1>

        {/* Trust badges */}
        <TrustBadges
          badges={badges}
          kycStatus={provider.kycStatus}
          size="md"
        />

        {/* Star rating + review count */}
        {provider.ratingCount > 0 && (
          <div className="flex items-center gap-2">
            {renderStars(provider.rating)}
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {provider.rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({provider.ratingCount} {t("reviews")})
            </span>
          </div>
        )}

        {/* City + member since */}
        <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:gap-3">
          {city && (
            <span className="flex items-center gap-1">
              <span>📍</span>
              <span>{city}</span>
            </span>
          )}
          <span className="hidden text-gray-300 sm:inline">·</span>
          <span>{memberSince}</span>
        </div>
      </div>
    </div>
  );
}
