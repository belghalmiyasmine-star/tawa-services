"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "../schemas/category-schemas";

// ============================================================
// TYPES
// ============================================================

export type CategoryTreeItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  _count: { services: number };
};

// ============================================================
// HELPERS
// ============================================================

async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }
  return { success: true, data: { userId: session.user.id } };
}

// ============================================================
// CATEGORY QUERIES
// ============================================================

/**
 * Fetch all non-deleted categories as a flat array.
 * Tree structure is built client-side.
 * Includes service count per category.
 */
export async function getCategoriesTreeAction(): Promise<
  ActionResult<CategoryTreeItem[]>
> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        _count: {
          select: { services: true },
        },
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("[getCategoriesTreeAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// CATEGORY WRITE ACTIONS
// ============================================================

/**
 * Create a new category.
 * Validates slug uniqueness.
 */
export async function createCategoryAction(
  data: CreateCategoryInput,
): Promise<ActionResult<{ categoryId: string }>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    // Check slug uniqueness
    const existing = await prisma.category.findFirst({
      where: { slug: parsed.data.slug, isDeleted: false },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "Ce slug est deja utilise" };
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        icon: parsed.data.icon ?? null,
        description: parsed.data.description ?? null,
        parentId: parsed.data.parentId ?? null,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
      },
      select: { id: true },
    });

    return { success: true, data: { categoryId: category.id } };
  } catch (error) {
    console.error("[createCategoryAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Update an existing category.
 * Validates slug uniqueness (excluding self).
 */
export async function updateCategoryAction(
  data: UpdateCategoryInput,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    // Check slug uniqueness (excluding self)
    const existing = await prisma.category.findFirst({
      where: {
        slug: parsed.data.slug,
        isDeleted: false,
        NOT: { id: parsed.data.id },
      },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "Ce slug est deja utilise" };
    }

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.id, isDeleted: false },
      select: { id: true },
    });

    if (!category) {
      return { success: false, error: "Categorie introuvable" };
    }

    await prisma.category.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        icon: parsed.data.icon ?? null,
        description: parsed.data.description ?? null,
        parentId: parsed.data.parentId ?? null,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateCategoryAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Soft-delete a category and its children.
 * Returns error if category has active services.
 */
export async function deleteCategoryAction(
  categoryId: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: {
        id: true,
        _count: { select: { services: { where: { isDeleted: false } } } },
        children: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categorie introuvable" };
    }

    // Check if category has active services
    if (category._count.services > 0) {
      return {
        success: false,
        error: "Cette categorie contient des services actifs",
      };
    }

    const now = new Date();
    const childrenIds = category.children.map((c) => c.id);

    // Also check children for services
    if (childrenIds.length > 0) {
      const childrenWithServices = await prisma.category.count({
        where: {
          id: { in: childrenIds },
          services: { some: { isDeleted: false } },
        },
      });

      if (childrenWithServices > 0) {
        return {
          success: false,
          error: "Une sous-categorie contient des services actifs",
        };
      }
    }

    // Soft-delete category and its children
    await prisma.$transaction(async (tx) => {
      if (childrenIds.length > 0) {
        await tx.category.updateMany({
          where: { id: { in: childrenIds } },
          data: { isDeleted: true, deletedAt: now },
        });
      }

      await tx.category.update({
        where: { id: categoryId },
        data: { isDeleted: true, deletedAt: now },
      });
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteCategoryAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Toggle the isActive flag on a category.
 */
export async function toggleCategoryActiveAction(
  categoryId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: { id: true, isActive: true },
    });

    if (!category) {
      return { success: false, error: "Categorie introuvable" };
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: !category.isActive },
      select: { isActive: true },
    });

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error) {
    console.error("[toggleCategoryActiveAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
