"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "./StarRating";

// ============================================================
// TYPES
// ============================================================

interface ReviewCardProps {
  review: {
    id: string;
    stars: number;
    qualityRating: number | null;
    punctualityRating: number | null;
    communicationRating: number | null;
    cleanlinessRating: number | null;
    text: string | null;
    photoUrls: string[];
    publishedAt: Date | null;
    authorName: string; // First name only
    flagged: boolean;
  };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Returns a relative time string in French (e.g., "il y a 3 jours").
 */
function formatRelativeDate(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "il y a quelques secondes";
  if (diffMinutes < 60)
    return `il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  if (diffHours < 24)
    return `il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  if (diffDays === 1) return "il y a 1 jour";
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  if (diffMonths === 1) return "il y a 1 mois";
  if (diffMonths < 12) return `il y a ${diffMonths} mois`;
  if (diffYears === 1) return "il y a 1 an";
  return `il y a ${diffYears} ans`;
}

/**
 * Returns initials (first letter) from a name string.
 */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ============================================================
// CRITERIA MINI-BAR
// ============================================================

interface CriteriaMiniBarProps {
  label: string;
  value: number | null;
}

function CriteriaMiniBar({ label, value }: CriteriaMiniBarProps) {
  if (value === null) return null;
  const percent = (value / 5) * 100;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-foreground">{value}/5</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ReviewCard({ review }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const TEXT_TRUNCATE_LIMIT = 300;
  const isLong =
    review.text !== null && review.text.length > TEXT_TRUNCATE_LIMIT;
  const displayedText =
    review.text === null
      ? null
      : isLong && !expanded
        ? review.text.slice(0, TEXT_TRUNCATE_LIMIT) + "…"
        : review.text;

  const relativeDate = formatRelativeDate(review.publishedAt);
  const initial = getInitial(review.authorName || "A");

  // Flagged reviews: show moderation notice instead of content
  if (review.flagged) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Cet avis est en cours de modération.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        {/* Top row: Avatar + author name + date + verified badge */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {review.authorName}
              </span>
              {relativeDate && (
                <span className="text-xs text-muted-foreground">
                  {relativeDate}
                </span>
              )}
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Réservation vérifiée</span>
          </div>
        </div>

        {/* Overall star rating */}
        <div className="mb-3">
          <StarRating
            value={review.stars}
            onChange={() => {}}
            size="sm"
            readonly
          />
        </div>

        {/* Criteria mini-grid (2x2) */}
        {(review.qualityRating !== null ||
          review.punctualityRating !== null ||
          review.communicationRating !== null ||
          review.cleanlinessRating !== null) && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <CriteriaMiniBar label="Qualite" value={review.qualityRating} />
            <CriteriaMiniBar
              label="Ponctualite"
              value={review.punctualityRating}
            />
            <CriteriaMiniBar
              label="Communication"
              value={review.communicationRating}
            />
            <CriteriaMiniBar label="Proprete" value={review.cleanlinessRating} />
          </div>
        )}

        {/* Review text with expand/collapse */}
        {displayedText && (
          <div className="mb-3">
            <p className="text-sm text-foreground leading-relaxed">
              {displayedText}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? "Reduire" : "Lire la suite"}
              </button>
            )}
          </div>
        )}

        {/* Photos: horizontal scroll thumbnails */}
        {review.photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {review.photoUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Photo ${idx + 1} de l'avis`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo lightbox dialog */}
      {lightboxUrl && (
        <Dialog
          open={lightboxUrl !== null}
          onOpenChange={(open) => {
            if (!open) setLightboxUrl(null);
          }}
        >
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">Photo de l&apos;avis</DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Photo agrandie"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
