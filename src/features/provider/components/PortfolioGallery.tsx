import { getTranslations } from "next-intl/server";

// ============================================================
// TYPES
// ============================================================

interface PortfolioGalleryProps {
  photos: Array<{
    id: string;
    photoUrl: string;
    caption: string | null;
  }>;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * PortfolioGallery — Read-only portfolio photo gallery for public profile.
 * Server component — no "use client".
 * Hidden when no photos.
 */
export async function PortfolioGallery({ photos }: PortfolioGalleryProps) {
  const t = await getTranslations("provider");

  // If no photos, render nothing
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-200">
        {t("portfolioSection")}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="flex flex-col gap-1">
            {/* 1:1 aspect ratio card */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <img
                src={photo.photoUrl}
                alt={photo.caption ?? t("portfolioSection")}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Caption */}
            {photo.caption && (
              <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                {photo.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
