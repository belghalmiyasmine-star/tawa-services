"use client";

import { useState } from "react";

// ============================================================
// TYPES
// ============================================================

interface ServiceImageGalleryProps {
  photos: string[];
  title: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ServiceImageGallery — Airbnb-style image gallery with thumbnail navigation.
 * Shows main large image (aspect-[4/3]) + row of up to 5 thumbnails below.
 * Falls back to a gradient placeholder when no photos provided.
 */
export function ServiceImageGallery({ photos, title }: ServiceImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Limit thumbnails to 5
  const displayPhotos = photos.slice(0, 5);
  const hasPhotos = displayPhotos.length > 0;

  const selectedPhoto = hasPhotos ? (displayPhotos[selectedIndex] ?? displayPhotos[0] ?? null) : null;

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl">
      {/* Main image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800">
        {hasPhotos && selectedPhoto ? (
          <img
            src={selectedPhoto}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl text-teal-300">🛠</span>
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {displayPhotos.length > 1 && (
        <div className="mt-2 flex gap-2">
          {displayPhotos.map((photo, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-[4/3] flex-1 overflow-hidden rounded-lg border-2 transition-all ${
                selectedIndex === index
                  ? "border-teal-500 opacity-100"
                  : "border-transparent opacity-70 hover:opacity-90"
              }`}
            >
              <img
                src={photo}
                alt={`${title} — photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
