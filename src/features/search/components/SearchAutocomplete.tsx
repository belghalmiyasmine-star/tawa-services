"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, icons } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ——————————————————————————————————————————————————
// Types matching the autocomplete API response shape
// ——————————————————————————————————————————————————
type AutocompleteCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type AutocompleteService = {
  id: string;
  title: string;
  fixedPrice: number | null;
  pricingType: string;
  category: { name: string; slug: string };
  provider: {
    displayName: string;
    photoUrl: string | null;
    rating: number;
    delegations: Array<{
      delegation: { gouvernorat: { name: string } };
    }>;
  };
};

type AutocompleteResults = {
  categories: AutocompleteCategory[];
  services: AutocompleteService[];
};

// ——————————————————————————————————————————————————
// Props
// ——————————————————————————————————————————————————
interface SearchAutocompleteProps {
  className?: string;
  placeholder?: string;
}

// ——————————————————————————————————————————————————
// Helper: convert kebab-case icon name to lucide component
// ——————————————————————————————————————————————————
function getLucideIcon(name: string | null) {
  if (!name) return null;
  const pascalCase = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const IconComponent = icons[pascalCase as keyof typeof icons];
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
}

// ——————————————————————————————————————————————————
// Component
// ——————————————————————————————————————————————————
export function SearchAutocomplete({ className, placeholder }: SearchAutocompleteProps) {
  const t = useTranslations("search");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompleteResults>({ categories: [], services: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ——————————————————————————————————————————————————
  // Close dropdown on outside click
  // ——————————————————————————————————————————————————
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ——————————————————————————————————————————————————
  // Fetch autocomplete results with 300ms debounce
  // ——————————————————————————————————————————————————
  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ categories: [], services: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as AutocompleteResults;
        setResults(data);
        setIsOpen(
          data.categories.length > 0 || data.services.length > 0 || q.trim().length >= 2
        );
      }
    } catch {
      // Silently ignore network errors — autocomplete is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear previous debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults({ categories: [], services: [] });
      setIsOpen(false);
      return;
    }

    // Set new 300ms debounce
    debounceRef.current = setTimeout(() => {
      void fetchResults(value);
    }, 300);
  }

  // ——————————————————————————————————————————————————
  // Build a flat list of navigable items for keyboard nav
  // ——————————————————————————————————————————————————
  const flatItems: Array<{ type: "category"; item: AutocompleteCategory } | { type: "service"; item: AutocompleteService }> = [
    ...results.categories.map((item) => ({ type: "category" as const, item })),
    ...results.services.map((item) => ({ type: "service" as const, item })),
  ];

  function navigateToItem(entry: (typeof flatItems)[number]) {
    if (entry.type === "category") {
      router.push(`/services?category=${entry.item.slug}` as never);
    } else {
      router.push(`/services/${entry.item.id}` as never);
    }
    setIsOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    const totalItems = flatItems.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flatItems[selectedIndex]) {
          navigateToItem(flatItems[selectedIndex]);
        } else {
          // Navigate to full search results
          router.push(`/services?q=${encodeURIComponent(query)}` as never);
          setIsOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length > 0) {
      router.push(`/services?q=${encodeURIComponent(query)}` as never);
      setIsOpen(false);
      setQuery("");
    }
  }

  const hasResults = results.categories.length > 0 || results.services.length > 0;
  const showDropdown = isOpen && (isLoading || hasResults || query.trim().length >= 2);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleFormSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 && hasResults) setIsOpen(true);
            }}
            placeholder={placeholder ?? t("autocompletePlaceholder")}
            className="rounded-full pl-9"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          />
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-white shadow-lg dark:bg-gray-800"
        >
          {isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {/* Categories section */}
              {results.categories.length > 0 && (
                <div>
                  <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("autocompleteCategories")}
                  </div>
                  {results.categories.map((cat, index) => {
                    const flatIndex = index;
                    return (
                      <button
                        key={cat.id}
                        role="option"
                        aria-selected={selectedIndex === flatIndex}
                        onClick={() => navigateToItem({ type: "category", item: cat })}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                          selectedIndex === flatIndex
                            ? "bg-gray-100 dark:bg-gray-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                      >
                        {cat.icon ? getLucideIcon(cat.icon) : null}
                        <span className="font-medium">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Services section */}
              {results.services.length > 0 && (
                <div>
                  <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("autocompleteServices")}
                  </div>
                  {results.services.map((svc, index) => {
                    const flatIndex = results.categories.length + index;
                    const city = svc.provider.delegations[0]?.delegation.gouvernorat.name ?? null;
                    return (
                      <button
                        key={svc.id}
                        role="option"
                        aria-selected={selectedIndex === flatIndex}
                        onClick={() => navigateToItem({ type: "service", item: svc })}
                        className={cn(
                          "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                          selectedIndex === flatIndex
                            ? "bg-gray-100 dark:bg-gray-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{svc.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {svc.provider.displayName}
                            {city ? ` · ${city}` : ""}
                            {" · "}
                            {svc.pricingType === "SUR_DEVIS"
                              ? t("priceSurDevis")
                              : svc.fixedPrice != null
                              ? `${svc.fixedPrice} TND`
                              : t("priceSurDevis")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty state when query >= 2 but no results */}
              {!hasResults && query.trim().length >= 2 && (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  {t("autocompleteNoResults")}
                </div>
              )}

              {/* See all results footer */}
              {hasResults && (
                <div className="border-t">
                  <button
                    onClick={() => {
                      router.push(`/services?q=${encodeURIComponent(query)}` as never);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>{t("autocompleteSeeAll", { query })}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
