import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SearchParams } from "@/lib/validations/search";

// ============================================================
// SHARED SEARCH QUERY BUILDER
// ============================================================

/**
 * Builds Prisma `where` + `orderBy` from parsed SearchParams.
 * Shared between:
 *  - /api/search/services (API route)
 *  - /services page (server component)
 *  - /services/[categorySlug] page (server component)
 */
export async function buildSearchQuery(params: SearchParams): Promise<{
  where: Prisma.ServiceWhereInput;
  orderBy:
    | Prisma.ServiceOrderByWithRelationInput
    | Prisma.ServiceOrderByWithRelationInput[];
}> {
  const {
    q,
    category,
    city,
    delegation,
    minPrice,
    maxPrice,
    pricingType,
    verified,
    minRating,
    sort,
  } = params;

  // ----------------------------------------------------------
  // 1. Resolve category filter (parent → children IDs)
  // ----------------------------------------------------------
  let categoryIds: string[] | undefined;

  if (category) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: category, isDeleted: false },
      select: {
        id: true,
        children: {
          where: { isDeleted: false, isActive: true },
          select: { id: true },
        },
      },
    });

    if (matchedCategory) {
      if (matchedCategory.children.length > 0) {
        categoryIds = matchedCategory.children.map((c) => c.id);
      } else {
        categoryIds = [matchedCategory.id];
      }
    }
  }

  // ----------------------------------------------------------
  // 2. Build where clause
  // ----------------------------------------------------------
  const where: Prisma.ServiceWhereInput = {
    status: "ACTIVE",
    isDeleted: false,
  };

  // Full-text search
  if (q && q.trim().length > 0) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { provider: { displayName: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Category filter
  if (categoryIds) {
    where.categoryId = { in: categoryIds };
  }

  // Provider-level filters (combined into single ProviderWhereInput)
  const providerFilter: Prisma.ProviderWhereInput = {};

  if (city) {
    providerFilter.delegations = {
      some: { delegation: { gouvernorat: { name: city } } },
    };
  }

  if (delegation) {
    providerFilter.delegations = {
      some: { delegation: { name: delegation } },
    };
  }

  if (verified === true) {
    providerFilter.kycStatus = "APPROVED";
  }

  if (minRating !== undefined) {
    providerFilter.rating = { gte: minRating };
  }

  if (Object.keys(providerFilter).length > 0) {
    where.provider = providerFilter;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Prisma.FloatNullableFilter = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    where.fixedPrice = priceFilter;
  }

  // Pricing type filter
  if (pricingType) {
    where.pricingType = pricingType;
  }

  // ----------------------------------------------------------
  // 3. Build orderBy
  // ----------------------------------------------------------
  let orderBy:
    | Prisma.ServiceOrderByWithRelationInput
    | Prisma.ServiceOrderByWithRelationInput[];

  switch (sort) {
    case "price_asc":
      orderBy = [{ fixedPrice: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ fixedPrice: "desc" }];
      break;
    case "rating":
      orderBy = [{ provider: { rating: "desc" } }];
      break;
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "relevance":
    default:
      orderBy = [{ isFeatured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }];
      break;
  }

  return { where, orderBy };
}
