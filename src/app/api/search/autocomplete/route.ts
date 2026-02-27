import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";

  // Return empty results for queries shorter than 2 characters
  if (q.trim().length < 2) {
    return NextResponse.json(
      { categories: [], services: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Validate max length
  if (q.length > 100) {
    return NextResponse.json(
      { error: "Query too long (max 100 characters)" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    // Run category and service queries in parallel for performance
    const [categories, services] = await Promise.all([
      // Category matches
      prisma.category.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
          isActive: true,
          isDeleted: false,
        },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      // Service matches — title OR description contains query
      prisma.service.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
          status: "ACTIVE",
          isDeleted: false,
        },
        take: 5,
        select: {
          id: true,
          title: true,
          fixedPrice: true,
          pricingType: true,
          category: {
            select: { name: true, slug: true },
          },
          provider: {
            select: {
              displayName: true,
              photoUrl: true,
              rating: true,
              delegations: {
                take: 1,
                select: {
                  delegation: {
                    select: {
                      gouvernorat: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { viewCount: "desc" },
      }),
    ]);

    return NextResponse.json(
      { categories, services },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[autocomplete] DB error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
