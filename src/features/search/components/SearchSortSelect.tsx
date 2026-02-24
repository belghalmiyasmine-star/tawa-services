"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================
// TYPES
// ============================================================

interface SearchSortSelectProps {
  currentSort: string;
}

// ============================================================
// SORT OPTIONS
// ============================================================

const SORT_OPTIONS = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "price_asc", labelKey: "sortPriceAsc" },
  { value: "price_desc", labelKey: "sortPriceDesc" },
  { value: "rating", labelKey: "sortRating" },
  { value: "newest", labelKey: "sortNewest" },
] as const;

// ============================================================
// COMPONENT
// ============================================================

/**
 * SearchSortSelect — Client component for selecting result sort order.
 * Updates URL searchParams with new `sort` value on selection.
 */
export function SearchSortSelect({ currentSort }: SearchSortSelectProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {t("sortBy")}
      </span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
