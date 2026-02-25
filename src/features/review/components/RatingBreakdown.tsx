import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

interface RatingBreakdownProps {
  distribution: Record<number, number>;
  total: number;
  average: number;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Displays the overall rating average with a 5-star distribution bar chart.
 * Used in ReviewsList header on provider profiles.
 */
export function RatingBreakdown({
  distribution,
  total,
  average,
}: RatingBreakdownProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:gap-8">
      {/* Average rating */}
      <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[100px]">
        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
          {average > 0 ? average.toFixed(1) : "—"}
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(average)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-gray-300",
              )}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {total} avis
        </span>
      </div>

      {/* Distribution bars — 5 to 1 star */}
      <div className="flex flex-1 flex-col gap-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars] ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={stars} className="flex items-center gap-2">
              {/* Star label */}
              <span className="w-6 text-right text-sm text-gray-600 dark:text-gray-400">
                {stars}
              </span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />

              {/* Progress bar track */}
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Count */}
              <span className="w-6 text-right text-xs text-gray-500 dark:text-gray-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
