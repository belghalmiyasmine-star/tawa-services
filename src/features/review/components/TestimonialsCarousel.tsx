"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star, Quote } from "lucide-react";

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
// STARS
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
              : "fill-transparent text-gray-200 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────

function AuthorAvatar({ name, src }: { name: string; src: string | null }) {
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
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {initials || "U"}
    </div>
  );
}

// ────────────────────────────────────────────────
// TESTIMONIAL CARD
// ────────────────────────────────────────────────

function TestimonialCard({
  item,
  state,
}: {
  item: TestimonialItem;
  state: "enter" | "visible" | "exit";
}) {
  const animClass =
    state === "enter"
      ? "animate-[slide-in_0.5s_ease-out_forwards]"
      : state === "exit"
        ? "animate-[slide-out_0.4s_ease-in_forwards]"
        : "";

  return (
    <div
      className={`card-elegant relative flex flex-col gap-4 rounded-2xl p-6 ${animClass}`}
    >
      {/* Quote icon — subtle */}
      <Quote className="absolute right-5 top-5 h-8 w-8 text-gray-100 dark:text-gray-800" />

      <Stars count={item.stars} />

      <p className="relative z-10 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        &ldquo;{item.text}&rdquo;
      </p>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700/50">
        <AuthorAvatar name={item.authorName} src={item.authorAvatar} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {item.authorName}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Avis pour {item.providerName}
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// CAROUSEL
// ────────────────────────────────────────────────

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const total = items.length;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning) return;
      setTransitioning(true);
      timeoutRef.current = setTimeout(() => {
        setCurrent(idx);
        setTransitioning(false);
      }, 400);
    },
    [transitioning],
  );

  const next = useCallback(() => {
    goTo((current + 1) % total);
  }, [current, total, goTo]);

  useEffect(() => {
    if (paused || total <= 1 || transitioning) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [paused, total, next, transitioning]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (total === 0) return null;

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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleIndices.map((idx, i) => (
          <TestimonialCard
            key={`${current}-${idx}`}
            item={items[idx]!}
            state={transitioning ? "exit" : i === 0 && !transitioning ? "enter" : "visible"}
          />
        ))}
      </div>

      {total > 3 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Avis ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
