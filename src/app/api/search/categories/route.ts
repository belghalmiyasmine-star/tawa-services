import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/search/categories
 *
 * Returns all active, non-deleted categories with their service counts.
 * Public endpoint — no authentication required.
 *
 * Response shape:
 * {
 *   categories: Array<{
 *     id: string;
 *     name: string;
 *     slug: string;
 *     icon: string | null;
 *     description: string | null;
 *     parentId: string | null;
 *     serviceCount: number;
 *     parent: { name: string; slug: string } | null;
 *   }>
 * }
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        parentId: true,
        parent: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            services: {
              where: {
                status: "ACTIVE",
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      parentId: cat.parentId,
      serviceCount: cat._count.services,
      parent: cat.parent,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("[GET /api/search/categories] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la recuperation des categories" },
      { status: 500 },
    );
  }
}
