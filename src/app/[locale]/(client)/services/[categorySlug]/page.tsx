import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { searchParamsSchema } from "@/lib/validations/search";
import { SearchFilters } from "@/features/search/components/SearchFilters";
import { SearchResultsGrid } from "@/features/search/components/SearchResultsGrid";
import { SearchPagination } from "@/features/search/components/SearchPagination";
import { SearchSortSelect } from "@/features/search/components/SearchSortSelect";
import { buildSearchQuery } from "@/features/search/lib/search-query";

// ============================================================
// TYPES
// ============================================================

interface CategoryPageProps {
  params: Promise<{
    locale: string;
    categorySlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug, isDeleted: false },
    select: { name: true },
  });

  if (!category) {
    return { title: "Categorie introuvable | Tawa Services" };
  }

  return {
    title: `${category.name} — Services | Tawa Services`,
    description: `Trouvez les meilleurs prestataires pour ${category.name} pres de chez vous.`,
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const t = await getTranslations("search");

  // Fetch the category
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug, isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      children: {
        where: { isDeleted: false, isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Parse URL search params
  const rawParams = await searchParams;
  const flatParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawParams)) {
    if (typeof v === "string") flatParams[k] = v;
    else if (Array.isArray(v) && v[0]) flatParams[k] = v[0];
  }

  const parsed = searchParamsSchema.safeParse({ ...flatParams, category: categorySlug });
  const filters = parsed.success ? parsed.data : { ...searchParamsSchema.parse({ category: categorySlug }) };

  // Build query using shared utility
  const { where, orderBy } = await buildSearchQuery(filters);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const skip = (page - 1) * limit;

  // Fetch services + count in parallel
  const [services, total] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / limit);

  // Fetch all root categories for filter sidebar
  const allCategories = await prisma.category.findMany({
    where: { isActive: true, isDeleted: false, parentId: null },
    select: { name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });

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
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-teal-600 dark:hover:text-teal-400"
        >
          Accueil
        </Link>
        <span>/</span>
        <Link
          href={"/services" as never}
          className="hover:text-teal-600 dark:hover:text-teal-400"
        >
          Services
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {category.name}
        </span>
      </nav>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {category.name}
        </h1>
        {total > 0 && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("resultsCount", { count: total })}
          </p>
        )}
      </div>

      {/* Subcategory chips (if parent category with children) */}
      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/services/${child.slug}` as never}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-teal-900/20"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sort + Results header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="lg:hidden">
          {/* Mobile: filters in Sheet (triggered inside SearchFilters) */}
          <SearchFilters
            categories={allCategories}
            currentFilters={currentFilters}
            mobileOnly
          />
        </div>
        <div className="ml-auto">
          <SearchSortSelect currentSort={filters.sort ?? "relevance"} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:col-span-1 lg:block">
          <SearchFilters
            categories={allCategories}
            currentFilters={currentFilters}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <SearchResultsGrid
            services={services}
            total={total}
          />

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
