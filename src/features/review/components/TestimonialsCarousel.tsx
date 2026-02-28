"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────

export interface TestimonialItem {
  id: string;
  stars: number;
  text: string;
  authorName: string;
  authorAvatar: string | null;
  providerName: string;
}

interface TestimonialsCarouselProps {
  items: TestimonialItem[];
}

// ────────────────────────────────────────────────
// STARS (read-only)
// ────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-gray-300 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────

function AuthorAvatar({
  name,
  src,
}: {
  name: string;
  src: string | null;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials || "U"}
    </div>
  );
}

// ────────────────────────────────────────────────
// CAROUSEL
// ────────────────────────────────────────────────

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [paused, total, next]);

  if (total === 0) return null;

  // Show up to 3 cards at a time on desktop, 1 on mobile
  // We use a sliding window approach
  const getVisibleIndices = () => {
    const indices: number[] = [];
    for (let i = 0; i < Math.min(3, total); i++) {
      indices.push((current + i) % total);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards grid — 1 col mobile, 2 md, 3 lg */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleIndices.map((idx) => {
          const item = items[idx]!;
          return (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Stars */}
              <Stars count={item.stars} />

              {/* Review text */}
              <p className="flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Author info */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <AuthorAvatar name={item.authorName} src={item.authorAvatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.authorName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Avis pour {item.providerName}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot navigation */}
      {total > 3 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Avis ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-primary"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
