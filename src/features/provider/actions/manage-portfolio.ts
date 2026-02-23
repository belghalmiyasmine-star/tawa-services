"use server";

import { unlink } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  portfolioPhotoSchema,
  type PortfolioPhotoFormData,
} from "@/lib/validations/provider";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

interface PortfolioPhotoData {
  id: string;
  photoUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Fetch all non-deleted portfolio photos for the current provider.
 */
export async function getPortfolioPhotosAction(): Promise<
  ActionResult<PortfolioPhotoData[]>
> {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Check role is PROVIDER
  if (session.user.role !== "PROVIDER") {
    return { success: false, error: "Acces reserve aux prestataires" };
  }

  const userId = session.user.id;

  try {
    // 3. Find provider
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // 4. Fetch all non-deleted photos ordered by sortOrder
    const photos = await prisma.portfolioPhoto.findMany({
      where: { providerId: provider.id, isDeleted: false },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        photoUrl: true,
        caption: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return { success: true, data: photos };
  } catch (error) {
    console.error("[getPortfolioPhotosAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Update the caption of a portfolio photo.
 * Verifies ownership before update.
 */
export async function updatePortfolioPhotoCaptionAction(data: {
  photoId: string;
  caption: string;
}): Promise<ActionResult<{ id: string }>> {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Check role is PROVIDER
  if (session.user.role !== "PROVIDER") {
    return { success: false, error: "Acces reserve aux prestataires" };
  }

  const userId = session.user.id;

  // 3. Validate caption
  const parsed = portfolioPhotoSchema.safeParse({ caption: data.caption });
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  try {
    // 4. Find provider
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // 5. Verify ownership
    const photo = await prisma.portfolioPhoto.findUnique({
      where: { id: data.photoId },
      select: { id: true, providerId: true },
    });

    if (!photo) {
      return { success: false, error: "Photo introuvable" };
    }

    if (photo.providerId !== provider.id) {
      return { success: false, error: "Acces interdit" };
    }

    // 6. Update caption
    const updated = await prisma.portfolioPhoto.update({
      where: { id: data.photoId },
      data: { caption: parsed.data.caption ?? null },
      select: { id: true },
    });

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updatePortfolioPhotoCaptionAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Soft-delete a portfolio photo and remove the physical file.
 * Verifies ownership before deletion.
 */
export async function deletePortfolioPhotoAction(
  photoId: string,
): Promise<ActionResult<{ removed: string }>> {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Check role is PROVIDER
  if (session.user.role !== "PROVIDER") {
    return { success: false, error: "Acces reserve aux prestataires" };
  }

  const userId = session.user.id;

  try {
    // 3. Find provider
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // 4. Verify ownership and get photo
    const photo = await prisma.portfolioPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, providerId: true, photoUrl: true },
    });

    if (!photo) {
      return { success: false, error: "Photo introuvable" };
    }

    if (photo.providerId !== provider.id) {
      return { success: false, error: "Acces interdit" };
    }

    // 5. Soft delete the record
    await prisma.portfolioPhoto.update({
      where: { id: photoId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // 6. Delete physical file (best effort — do not block on failure)
    try {
      const filePath = path.join(process.cwd(), "public", photo.photoUrl);
      await unlink(filePath);
    } catch {
      // File deletion is best effort — log but don't fail the action
      console.warn(
        `[deletePortfolioPhotoAction] Could not delete physical file: ${photo.photoUrl}`,
      );
    }

    return { success: true, data: { removed: photoId } };
  } catch (error) {
    console.error("[deletePortfolioPhotoAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
