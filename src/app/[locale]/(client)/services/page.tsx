import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { searchParamsSchema } from "@/lib/validations/search";
import { buildSearchQuery } from "@/features/search/lib/search-query";
import { CategoryGrid } from "@/features/search/components/CategoryGrid";
import { SearchFilters } from "@/features/search/components/SearchFilters";
import { SearchResultsGrid } from "@/features/search/components/SearchResultsGrid";
import { SearchPagination } from "@/features/search/components/SearchPagination";
import { SearchSortSelect } from "@/features/search/components/SearchSortSelect";

// ============================================================
// TYPES
// ============================================================

interface ServicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Rechercher des services | Tawa Services",
    description:
      "Trouvez les meilleurs prestataires de services pres de chez vous en Tunisie.",
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const t = await getTranslations("search");

  // Next.js 15: searchParams is a Promise — await it
  const rawParams = await searchParams;

  // Flatten (take first value for each key)
  const flatParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawParams)) {
    if (typeof v === "string") flatParams[k] = v;
    else if (Array.isArray(v) && v[0]) flatParams[k] = v[0];
  }

  // Parse and validate params (use defaults on failure)
  const parsed = searchParamsSchema.safeParse(flatParams);
  const filters = parsed.success ? parsed.data : searchParamsSchema.parse({});

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;

  // Determine if any filters are active (browsing mode vs filtered mode)
  const hasActiveFilters =
    !!filters.q ||
    !!filters.category ||
    !!filters.city ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    !!filters.pricingType ||
    filters.verified !== undefined;

  // Build query
  const { where, orderBy } = await buildSearchQuery(filters);

  const skip = (page - 1) * limit;

  // Fetch services + count + categories in parallel
  const [services, total, rootCategories] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        pricingType: true,
        fixedPrice: true,
        durationMinutes: true,
        photoUrls: true,
        category: {
          select: {
            name: true,
            parent: { select: { name: true } },
          },
        },
        provider: {
          select: {
            displayName: true,
            photoUrl: true,
            rating: true,
            ratingCount: true,
            delegations: {
              select: {
                delegation: {
                  select: { gouvernorat: { select: { name: true } } },
                },
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.service.count({ where }),
    // Fetch root categories with service counts for CategoryGrid + filter sidebar
    prisma.category.findMany({
      where: { isActive: true, isDeleted: false, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: {
          select: {
            services: {
              where: { status: "ACTIVE", isDeleted: false },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Format categories for CategoryGrid
  const categoriesForGrid = rootCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    serviceCount: cat._count.services,
  }));

  // Format categories for filter sidebar (just name + slug)
  const categoriesForFilter = rootCategories.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
  }));

  const currentFilters = {
    category: filters.category,
    city: filters.city,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    pricingType: filters.pricingType,
    verified: filters.verified,
    minRating: filters.minRating,
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h1>
      </div>

      {/* Categories grid — shown when no active filters (browsing mode) */}
      {!hasActiveFilters && categoriesForGrid.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("categoriesTitle")}
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t("categoriesSubtitle")}
          </p>
          <CategoryGrid categories={categoriesForGrid} />
        </div>
      )}

      {/* Sort + mobile filter trigger */}
      <div className="mb-4 flex items-center justify-between">
        <div className="lg:hidden">
          <SearchFilters
            categories={categoriesForFilter}
            currentFilters={currentFilters}
            mobileOnly
          />
        </div>
        <div className="ml-auto">
          <SearchSortSelect currentSort={filters.sort ?? "relevance"} />
        </div>
      </div>

      {/* Two-column layout: sidebar + results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left sidebar — desktop only */}
        <div className="hidden lg:col-span-1 lg:block">
          <SearchFilters
            categories={categoriesForFilter}
            currentFilters={currentFilters}
          />
        </div>

        {/* Results grid */}
        <div className="lg:col-span-3">
          <SearchResultsGrid services={services} total={total} />

          {totalPages > 1 && (
            <div className="mt-6">
              <SearchPagination
                currentPage={page}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
