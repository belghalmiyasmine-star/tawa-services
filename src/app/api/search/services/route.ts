import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { searchParamsSchema } from "@/lib/validations/search";

/**
 * GET /api/search/services
 *
 * Public search endpoint — no authentication required.
 * Returns filtered, sorted, paginated services with provider info.
 *
 * Query params: see searchParamsSchema in @/lib/validations/search
 *
 * Response shape:
 * {
 *   services: Array<ServiceWithProvider>;
 *   total: number;
 *   page: number;
 *   limit: number;
 *   totalPages: number;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // -------------------------------------------------------
    // 1. Parse & validate query params
    // -------------------------------------------------------
    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = searchParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parametres invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

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
      page,
      limit,
    } = parsed.data;

    // -------------------------------------------------------
    // 2. Resolve category filter (parent or leaf)
    // -------------------------------------------------------
    let categoryIds: string[] | undefined;

    if (category) {
      // Find the category by slug
      const matchedCategory = await prisma.category.findUnique({
        where: { slug: category, isDeleted: false },
        select: {
          id: true,
          parentId: true,
          children: {
            where: { isDeleted: false, isActive: true },
            select: { id: true },
          },
        },
      });

      if (matchedCategory) {
        if (matchedCategory.children.length > 0) {
          // It's a parent category — include all active children
          categoryIds = matchedCategory.children.map((c) => c.id);
        } else {
          // It's a leaf category
          categoryIds = [matchedCategory.id];
        }
      } else {
        // Category slug not found — return empty results
        return NextResponse.json({
          services: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // -------------------------------------------------------
    // 3. Build Prisma where clause
    // -------------------------------------------------------
    const where: Prisma.ServiceWhereInput = {
      status: "ACTIVE",
      isDeleted: false,
    };

    // Full-text search on title, description, or provider displayName
    if (q && q.trim().length > 0) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        {
          provider: {
            displayName: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    // Category filter
    if (categoryIds) {
      where.categoryId = { in: categoryIds };
    }

    // Build provider filter — combine all provider-level filters
    const providerFilter: Prisma.ProviderWhereInput = {};

    // City filter (gouvernorat)
    if (city) {
      providerFilter.delegations = {
        some: {
          delegation: {
            gouvernorat: { name: city },
          },
        },
      };
    }

    // Delegation filter (sub-city area) — combined with city if both present
    if (delegation) {
      providerFilter.delegations = {
        some: {
          delegation: { name: delegation },
        },
      };
    }

    // KYC verified providers only
    if (verified === true) {
      providerFilter.kycStatus = "APPROVED";
    }

    // Minimum rating filter
    if (minRating !== undefined) {
      providerFilter.rating = { gte: minRating };
    }

    // Apply provider filter if any provider-level filter was set
    if (Object.keys(providerFilter).length > 0) {
      where.provider = providerFilter;
    }

    // Price range — only applicable to FIXED pricing
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

    // -------------------------------------------------------
    // 4. Build orderBy
    // -------------------------------------------------------
    let orderBy: Prisma.ServiceOrderByWithRelationInput | Prisma.ServiceOrderByWithRelationInput[];

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

    // -------------------------------------------------------
    // 5. Pagination
    // -------------------------------------------------------
    const skip = (page - 1) * limit;
    const take = limit;

    // -------------------------------------------------------
    // 6. Execute queries in parallel
    // -------------------------------------------------------
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          pricingType: true,
          fixedPrice: true,
          durationMinutes: true,
          photoUrls: true,
          status: true,
          isFeatured: true,
          viewCount: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          provider: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true,
              rating: true,
              ratingCount: true,
              kycStatus: true,
              delegations: {
                select: {
                  delegation: {
                    select: {
                      id: true,
                      name: true,
                      gouvernorat: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      services,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/search/services] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la recherche de services" },
      { status: 500 },
    );
  }
}
