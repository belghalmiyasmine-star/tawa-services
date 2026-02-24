"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";

import { TUNISIA_GOUVERNORATS } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================

interface FilterCategory {
  name: string;
  slug: string;
}

interface CurrentFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  pricingType?: "FIXED" | "SUR_DEVIS";
  verified?: boolean;
  minRating?: number;
}

interface SearchFiltersProps {
  categories: FilterCategory[];
  currentFilters: CurrentFilters;
  /** When true, renders only the mobile Sheet trigger button (used on mobile row) */
  mobileOnly?: boolean;
}

// ============================================================
// FILTER SECTION (collapsible)
// ============================================================

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 py-4 last:border-0 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ============================================================
// FILTER CONTENT (inner content shared between sidebar & sheet)
// ============================================================

function FiltersContent({
  categories,
  currentFilters,
}: {
  categories: FilterCategory[];
  currentFilters: CurrentFilters;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for debounced price inputs
  const [minPrice, setMinPrice] = useState(
    currentFilters.minPrice?.toString() ?? "",
  );
  const [maxPrice, setMaxPrice] = useState(
    currentFilters.maxPrice?.toString() ?? "",
  );

  // Shared helper: update a single param, reset page
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Debounced price update
  const debounceRef = useRef<{ min: ReturnType<typeof setTimeout> | null; max: ReturnType<typeof setTimeout> | null }>({ min: null, max: null });

  function handleMinPriceChange(val: string) {
    setMinPrice(val);
    if (debounceRef.current.min) clearTimeout(debounceRef.current.min);
    debounceRef.current.min = setTimeout(() => updateParam("minPrice", val), 500);
  }

  function handleMaxPriceChange(val: string) {
    setMaxPrice(val);
    if (debounceRef.current.max) clearTimeout(debounceRef.current.max);
    debounceRef.current.max = setTimeout(() => updateParam("maxPrice", val), 500);
  }

  function clearAllFilters() {
    // Keep only q and sort
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const sort = searchParams.get("sort");
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    setMinPrice("");
    setMaxPrice("");
    router.push(`?${params.toString()}`);
  }

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.city ||
    currentFilters.minPrice !== undefined ||
    currentFilters.maxPrice !== undefined ||
    currentFilters.pricingType ||
    currentFilters.verified;

  return (
    <div className="flex flex-col">
      {/* Categories */}
      <FilterSection title={t("category")}>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => updateParam("category", null)}
            className={`rounded px-2 py-1 text-left text-sm transition-colors ${
              !currentFilters.category
                ? "bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateParam("category", cat.slug)}
              className={`rounded px-2 py-1 text-left text-sm transition-colors ${
                currentFilters.category === cat.slug
                  ? "bg-teal-50 font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* City */}
      <FilterSection title={t("city")}>
        <Select
          value={currentFilters.city ?? "all"}
          onValueChange={(val) => updateParam("city", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("allCities")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCities")}</SelectItem>
            {TUNISIA_GOUVERNORATS.map((gov) => (
              <SelectItem key={gov} value={gov}>
                {gov}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Price range */}
      <FilterSection title={t("priceRange")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t("minPrice")}
            value={minPrice}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            min={0}
            className="w-1/2"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            placeholder={t("maxPrice")}
            value={maxPrice}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            min={0}
            className="w-1/2"
          />
        </div>
      </FilterSection>

      {/* Pricing type */}
      <FilterSection title={t("pricingType")}>
        <div className="flex flex-col gap-2">
          {[
            { value: null, label: t("all") ?? "Tous" },
            { value: "FIXED", label: t("fixedPrice") },
            { value: "SUR_DEVIS", label: t("onQuote") },
          ].map((opt) => (
            <label
              key={opt.value ?? "all"}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="pricingType"
                checked={
                  opt.value === null
                    ? !currentFilters.pricingType
                    : currentFilters.pricingType === opt.value
                }
                onChange={() =>
                  updateParam("pricingType", opt.value)
                }
                className="accent-teal-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Verified only */}
      <FilterSection title={t("verifiedOnly")}>
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={!!currentFilters.verified}
            onCheckedChange={(checked) =>
              updateParam("verified", checked ? "true" : null)
            }
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t("verifiedOnly")}
          </span>
        </label>
      </FilterSection>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="mt-4 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * SearchFilters — Client component for search filter sidebar.
 * Desktop: left sidebar (w-64, sticky).
 * Mobile: Sheet triggered by "Filtres" button.
 * When mobileOnly=true, renders only the mobile Sheet trigger.
 */
export function SearchFilters({ categories, currentFilters, mobileOnly = false }: SearchFiltersProps) {
  const t = useTranslations("search");

  if (mobileOnly) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {t("filters")}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{t("filters")}</SheetTitle>
          </SheetHeader>
          <FiltersContent
            categories={categories}
            currentFilters={currentFilters}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="sticky top-20 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("filters")}
      </h2>
      <FiltersContent
        categories={categories}
        currentFilters={currentFilters}
      />
    </div>
  );
}
