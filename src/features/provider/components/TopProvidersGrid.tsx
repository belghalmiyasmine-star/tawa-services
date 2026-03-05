import { Star, BadgeCheck, MapPin, Briefcase } from "lucide-react";
import { Link } from "@/i18n/routing";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────

export interface TopProviderItem {
  id: string;
  displayName: string;
  photoUrl: string | null;
  rating: number;
  ratingCount: number;
  completedMissions: number;
  city: string | null;
  isVerified: boolean;
}

interface TopProvidersGridProps {
  providers: TopProviderItem[];
}

// ────────────────────────────────────────────────
// STARS
// ────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f-${i}`}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
        />
      ))}
      {hasHalf && (
        <Star className="h-3.5 w-3.5 fill-amber-200 text-amber-400" />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e-${i}`}
          className="h-3.5 w-3.5 fill-transparent text-gray-200 dark:text-gray-600"
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// PROVIDER CARD
// ────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: TopProviderItem }) {
  const initials = provider.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/providers/${provider.id}`}
      className="card-elegant group flex flex-col items-center gap-3 rounded-2xl p-6"
    >
      {/* Avatar */}
      <div className="relative">
        {provider.photoUrl ? (
          <img
            src={provider.photoUrl}
            alt={provider.displayName}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 transition-all duration-300 group-hover:ring-primary/20 dark:ring-gray-700"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500 ring-2 ring-gray-100 transition-all duration-300 group-hover:ring-primary/20 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-700">
            {initials || "P"}
          </div>
        )}
        {/* Verified badge */}
        {provider.isVerified && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm dark:bg-gray-800">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
        {provider.displayName}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <RatingStars rating={provider.rating} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {provider.rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400">
          ({provider.ratingCount})
        </span>
      </div>

      {/* City + missions */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
        {provider.city && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {provider.city}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {provider.completedMissions} mission{provider.completedMissions !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────
// GRID
// ────────────────────────────────────────────────

export function TopProvidersGrid({ providers }: TopProvidersGridProps) {
  if (providers.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
