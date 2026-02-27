"use client";

import { useState, useTransition } from "react";

import { Heart } from "lucide-react";

import { toggleFavoriteAction } from "../actions/toggle-favorite";

// ============================================================
// TYPES
// ============================================================

interface FavoriteButtonProps {
  serviceId: string;
  initialFavorited: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * FavoriteButton — interactive heart icon for toggling service favorites.
 *
 * - Optimistic UI: updates local state immediately on click
 * - Calls toggleFavoriteAction server action
 * - Prevents parent Link navigation on click
 * - Shows filled red heart when favorited, gray outline when not
 */
export function FavoriteButton({ serviceId, initialFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setIsFavorited((prev) => !prev);

    startTransition(async () => {
      const result = await toggleFavoriteAction(serviceId);
      if (!result.success) {
        // Revert on failure
        setIsFavorited((prev) => !prev);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorited}
      className="rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 dark:bg-gray-800/80"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isFavorited
            ? "fill-red-500 text-red-500"
            : "fill-none text-gray-400 hover:text-red-400"
        }`}
      />
    </button>
  );
}
