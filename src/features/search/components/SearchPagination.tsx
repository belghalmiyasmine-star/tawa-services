"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Builds a compact page range array with ellipsis.
 * e.g. for page 5 of 10: [1, '...', 4, 5, 6, '...', 10]
 */
function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * SearchPagination — Client component for paginating search results.
 * Updates URL searchParams `page` value on click.
 * Shows Previous | page numbers with ellipsis | Next.
 */
export function SearchPagination({ currentPage, totalPages }: SearchPaginationProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  }

  const pages = buildPageRange(currentPage, totalPages);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Page indicator */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("page")} {currentPage} / {totalPages}
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t("previous")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("previous")}</span>
        </Button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-sm text-gray-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(p)}
              className="min-w-[2rem]"
            >
              {p}
            </Button>
          ),
        )}

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t("nextPage")}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t("nextPage")}</span>
        </Button>
      </div>
    </div>
  );
}
