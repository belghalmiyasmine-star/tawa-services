"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  label?: string;
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  label,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const iconSize = SIZE_MAP[size];

  return (
    <div
      role={readonly ? undefined : "radiogroup"}
      aria-label={label}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = hoverValue > 0 ? star <= hoverValue : star <= value;
        const isHovered = hoverValue > 0 && star <= hoverValue;

        return (
          <button
            key={star}
            type="button"
            role={readonly ? undefined : "radio"}
            aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
            aria-checked={!readonly && star === value}
            disabled={readonly}
            className={cn(
              "cursor-pointer transition-colors",
              readonly && "cursor-default",
            )}
            onClick={() => {
              if (!readonly) onChange(star);
            }}
            onMouseEnter={() => {
              if (!readonly) setHoverValue(star);
            }}
            onMouseLeave={() => {
              if (!readonly) setHoverValue(0);
            }}
          >
            <Star
              className={cn(
                iconSize,
                isFilled && !isHovered && "fill-amber-400 text-amber-400",
                isHovered && "fill-amber-200 text-amber-300",
                !isFilled && "fill-transparent text-gray-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
