"use client";

import { Heart } from "lucide-react";
import { useRouter } from "@/i18n/routing";

/**
 * GuestHeartButton — heart icon for non-authenticated users.
 * Prevents click from bubbling to parent Link (service card navigation).
 * Redirects to login page on click.
 */
export function GuestHeartButton() {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push("/auth/login");
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Ajouter aux favoris"
      className="rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 dark:bg-gray-800/80"
    >
      <Heart className="h-4 w-4 fill-none text-gray-400 hover:text-red-400" />
    </button>
  );
}
