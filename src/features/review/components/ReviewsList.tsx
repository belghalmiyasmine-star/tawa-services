"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronDown, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProviderReviewsAction,
  type CriteriaAverages,
  type ProviderReviewsResult,
  type ReviewWithAuthor,
} from "@/features/review/actions/review-queries";

import { CriteriaChart } from "./CriteriaChart";
import { RatingBreakdown } from "./RatingBreakdown";
import { ReviewCard } from "./ReviewCard";

// ============================================================
// TYPES
// ============================================================

type SortOption = "recent" | "best" | "worst";

interface ReviewsListProps {
  providerId: string;
  initialData?: ProviderReviewsResult;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Computes a star distribution map from an array of published reviews.
 * Since the server action does not return individual stars for distribution
 * computation, we derive distribution from the fetched page reviews.
 * When total > limit, distribution is approximate (page-level).
 */
function buildDistribution(
  reviews: ReviewWithAuthor[],
): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.stars)));
    dist[star] = (dist[star] ?? 0) + 1;
  }
  return dist;
}

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Plus recents",
  best: "Meilleures notes",
  worst: "Moins bonnes notes",
};

const PAGE_SIZE = 5;

// ============================================================
// COMPONENT
// ============================================================

/**
 * Full review list for a provider profile.
 * - Fetches from server action (SSR-compatible via initialData)
 * - Supports sort by recent / best / worst
 * - "Voir plus" pagination (appends next page)
 */
export function ReviewsList({ providerId, initialData }: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>(
    initialData?.reviews ?? [],
  );
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [averages, setAverages] = useState<CriteriaAverages>(
    initialData?.averages ?? {
      stars: 0,
      quality: 0,
      punctuality: 0,
      communication: 0,
      cleanliness: 0,
    },
  );

  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch first page for a given sort option
  const fetchPage1 = useCallback(
    (sortOption: SortOption) => {
      startTransition(async () => {
        setError(null);
        const result = await getProviderReviewsAction(providerId, {
          page: 1,
          limit: PAGE_SIZE,
          sort: sortOption,
        });
        if (result.success) {
          setReviews(result.data.reviews);
          setTotal(result.data.total);
          setAverages(result.data.averages);
          setPage(1);
        } else {
          setError(result.error);
        }
      });
    },
    [providerId],
  );

  // Initial fetch if no initialData provided
  useEffect(() => {
    if (!initialData) {
      fetchPage1("recent");
    }
  }, [initialData, fetchPage1]);

  // Sort change handler
  const handleSortChange = (value: string) => {
    const newSort = value as SortOption;
    setSort(newSort);
    fetchPage1(newSort);
  };

  // Load more (append next page)
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);

    try {
      const result = await getProviderReviewsAction(providerId, {
        page: nextPage,
        limit: PAGE_SIZE,
        sort,
      });
      if (result.success) {
        setReviews((prev) => [...prev, ...result.data.reviews]);
        setPage(nextPage);
      } else {
        setError(result.error);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = reviews.length < total;
  const distribution = buildDistribution(reviews);

  return (
    <div className="space-y-6">
      {/* Header: breakdown + criteria chart */}
      {(total > 0 || isPending) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RatingBreakdown
            distribution={distribution}
            total={total}
            average={averages.stars}
          />
          <CriteriaChart
            averages={{
              quality: averages.quality,
              punctuality: averages.punctuality,
              communication: averages.communication,
              cleanliness: averages.cleanliness,
            }}
          />
        </div>
      )}

      {/* Sort control */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} avis
          </p>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error state */}
      {error && !isPending && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Review list */}
      {!isPending && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                stars: review.stars,
                qualityRating: review.qualityRating,
                punctualityRating: review.punctualityRating,
                communicationRating: review.communicationRating,
                cleanlinessRating: review.cleanlinessRating,
                text: review.text,
                photoUrls: review.photoUrls,
                publishedAt: review.publishedAt,
                authorName: review.author.firstName ?? "Anonyme",
                flagged: review.flagged,
              }}
            />
          ))}

          {/* Voir plus button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Voir plus
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Aucun avis pour le moment
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Les avis apparaissent apres chaque reservation terminee
          </p>
        </div>
      )}
    </div>
  );
}
