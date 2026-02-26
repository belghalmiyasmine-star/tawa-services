"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

import {
  createFaqSchema,
  updateFaqSchema,
  updateLegalPageSchema,
  createBannerSchema,
  updateBannerSchema,
  type CreateFaqInput,
  type UpdateFaqInput,
  type UpdateLegalPageInput,
  type CreateBannerInput,
  type UpdateBannerInput,
} from "../schemas/content-schemas";

// ============================================================
// HELPERS
// ============================================================

/**
 * Check session and assert ADMIN role. Returns userId if valid.
 */
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
// FAQ ACTIONS
// ============================================================

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get all FAQs (not deleted), ordered by sortOrder then category.
 */
export async function getFaqsAction(): Promise<ActionResult<FaqItem[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const faqs = await prisma.faq.findMany({
      where: { isDeleted: false },
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { createdAt: "asc" }],
    });

    return { success: true, data: faqs };
  } catch (error) {
    console.error("[getFaqsAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Create a new FAQ item.
 */
export async function createFaqAction(
  data: CreateFaqInput,
): Promise<ActionResult<FaqItem>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = createFaqSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    const faq = await prisma.faq.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        category: parsed.data.category,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });

    return { success: true, data: faq };
  } catch (error) {
    console.error("[createFaqAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Update an existing FAQ item.
 */
export async function updateFaqAction(
  data: UpdateFaqInput,
): Promise<ActionResult<FaqItem>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateFaqSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    const existing = await prisma.faq.findUnique({
      where: { id: parsed.data.id, isDeleted: false },
    });

    if (!existing) {
      return { success: false, error: "FAQ introuvable" };
    }

    const faq = await prisma.faq.update({
      where: { id: parsed.data.id },
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        category: parsed.data.category,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });

    return { success: true, data: faq };
  } catch (error) {
    console.error("[updateFaqAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Soft-delete a FAQ item.
 */
export async function deleteFaqAction(
  id: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const existing = await prisma.faq.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return { success: false, error: "FAQ introuvable" };
    }

    await prisma.faq.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteFaqAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// LEGAL PAGE ACTIONS
// ============================================================

export type LegalPageItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get all legal pages. Seeds 3 default pages if empty (idempotent via upsert).
 */
export async function getLegalPagesAction(): Promise<
  ActionResult<LegalPageItem[]>
> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    // Seed default pages if they don't exist (idempotent upsert)
    const defaultPages = [
      {
        slug: "cgu",
        title: "Conditions Generales d'Utilisation",
        content: "Contenu a rediger...",
      },
      {
        slug: "privacy",
        title: "Politique de Confidentialite",
        content: "Contenu a rediger...",
      },
      {
        slug: "legal-mentions",
        title: "Mentions Legales",
        content: "Contenu a rediger...",
      },
    ];

    await Promise.all(
      defaultPages.map((page) =>
        prisma.legalPage.upsert({
          where: { slug: page.slug },
          update: {},
          create: page,
        }),
      ),
    );

    const pages = await prisma.legalPage.findMany({
      orderBy: { slug: "asc" },
    });

    return { success: true, data: pages };
  } catch (error) {
    console.error("[getLegalPagesAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Update a legal page's title and content.
 */
export async function updateLegalPageAction(
  data: UpdateLegalPageInput,
): Promise<ActionResult<LegalPageItem>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateLegalPageSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    const existing = await prisma.legalPage.findUnique({
      where: { id: parsed.data.id },
    });

    if (!existing) {
      return { success: false, error: "Page introuvable" };
    }

    const page = await prisma.legalPage.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        updatedBy: authResult.data.userId,
      },
    });

    return { success: true, data: page };
  } catch (error) {
    console.error("[updateLegalPageAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ============================================================
// BANNER ACTIONS
// ============================================================

export type BannerItem = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  sortOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get all banners (not deleted), ordered by sortOrder.
 */
export async function getBannersAction(): Promise<ActionResult<BannerItem[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const banners = await prisma.banner.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: "asc" },
    });

    return { success: true, data: banners };
  } catch (error) {
    console.error("[getBannersAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Create a new banner.
 */
export async function createBannerAction(
  data: CreateBannerInput,
): Promise<ActionResult<BannerItem>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = createBannerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    const banner = await prisma.banner.create({
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        imageUrl: parsed.data.imageUrl || null,
        linkUrl: parsed.data.linkUrl || null,
        position: parsed.data.position,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    return { success: true, data: banner };
  } catch (error) {
    console.error("[createBannerAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Update an existing banner.
 */
export async function updateBannerAction(
  data: UpdateBannerInput,
): Promise<ActionResult<BannerItem>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateBannerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Donnees invalides",
    };
  }

  try {
    const existing = await prisma.banner.findUnique({
      where: { id: parsed.data.id, isDeleted: false },
    });

    if (!existing) {
      return { success: false, error: "Banniere introuvable" };
    }

    const banner = await prisma.banner.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        imageUrl: parsed.data.imageUrl || null,
        linkUrl: parsed.data.linkUrl || null,
        position: parsed.data.position,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    return { success: true, data: banner };
  } catch (error) {
    console.error("[updateBannerAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Soft-delete a banner.
 */
export async function deleteBannerAction(
  id: string,
): Promise<ActionResult<void>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const existing = await prisma.banner.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return { success: false, error: "Banniere introuvable" };
    }

    await prisma.banner.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteBannerAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Toggle the isActive boolean on a banner.
 */
export async function toggleBannerActiveAction(
  id: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const existing = await prisma.banner.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Banniere introuvable" };
    }

    const updated = await prisma.banner.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { isActive: true },
    });

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error) {
    console.error("[toggleBannerActiveAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
