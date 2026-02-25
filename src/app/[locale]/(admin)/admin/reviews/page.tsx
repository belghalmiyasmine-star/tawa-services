import type { Metadata } from "next";
import { Flag, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getFlaggedReviewsAction } from "@/features/review/actions/review-queries";
import { AdminReviewActions } from "@/features/review/components/AdminReviewActions";

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Moderation des avis | Admin",
  };
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const AUTHOR_ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  PROVIDER: "Prestataire",
};

// ============================================================
// PAGE
// ============================================================

/**
 * Admin moderation queue for flagged reviews.
 * Auth guard is handled by the (admin) layout — only ADMIN role can reach this page.
 */
export default async function AdminReviewsPage() {
  const result = await getFlaggedReviewsAction();
  const reviews = result.success ? result.data : [];
  const errorMessage = !result.success ? result.error : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Moderation des avis</h1>
        {reviews.length > 0 && (
          <Badge variant="destructive" className="text-sm">
            {reviews.length} signale{reviews.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Empty state */}
      {!errorMessage && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-600">
          <Flag className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Aucun avis signale
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Tous les avis sont conformes aux regles de la plateforme.
          </p>
        </div>
      )}

      {/* Flagged reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm dark:border-orange-800 dark:bg-gray-800"
            >
              {/* Header row: author info + flag badge + stars */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {review.authorName ?? "Auteur inconnu"}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {AUTHOR_ROLE_LABEL[review.authorRole] ?? review.authorRole}
                    </Badge>
                  </div>

                  {/* Target */}
                  {review.targetName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Evalue :{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {review.targetName}
                      </span>
                    </p>
                  )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={
                        s <= review.stars
                          ? "h-4 w-4 fill-amber-400 text-amber-400"
                          : "h-4 w-4 fill-transparent text-gray-300"
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Booking context */}
              {(review.serviceTitle ?? review.bookingDate) && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {review.serviceTitle && (
                    <span>
                      Service :{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {review.serviceTitle}
                      </span>
                    </span>
                  )}
                  {review.bookingDate && (
                    <span>
                      Date :{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(review.bookingDate)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Flagged reason */}
              {review.flaggedReason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange-50 p-2.5 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Raison du signalement : {review.flaggedReason}</span>
                </div>
              )}

              {/* Review text */}
              {review.text && (
                <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {review.text}
                </p>
              )}

              {/* Photos */}
              {review.photoUrls.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {review.photoUrls.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="h-20 w-20 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-600"
                    />
                  ))}
                </div>
              )}

              {/* Footer: date + moderation actions */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Signale le {formatDate(review.createdAt)}
                </p>
                <AdminReviewActions reviewId={review.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
