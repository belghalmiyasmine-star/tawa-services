import crypto from "crypto";
import { unlink, mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allowed MIME types for portfolio photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PORTFOLIO_PHOTOS = 10;

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/provider/portfolio
 * Upload a portfolio work photo.
 * Enforces max 10 active photos per provider.
 * Stores to /public/uploads/providers/[userId]/portfolio/[uuid].[ext]
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifie" },
        { status: 401 },
      );
    }

    // 2. Check role is PROVIDER
    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Acces reserve aux prestataires" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    // 3. Get provider record
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Profil prestataire introuvable" },
        { status: 404 },
      );
    }

    const providerId = provider.id;

    // 4. Check current portfolio photo count
    const currentCount = await prisma.portfolioPhoto.count({
      where: { providerId, isDeleted: false },
    });

    if (currentCount >= MAX_PORTFOLIO_PHOTOS) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 photos de portfolio" },
        { status: 400 },
      );
    }

    // 5. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const captionField = formData.get("caption");

    // 6. Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // 7. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Format accepte: JPEG, PNG, WebP" },
        { status: 400 },
      );
    }

    // 8. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas depasser 5 Mo" },
        { status: 400 },
      );
    }

    // 9. Extract and validate caption (max 200 chars)
    const caption =
      captionField && typeof captionField === "string"
        ? captionField.slice(0, 200).trim() || null
        : null;

    // 10. Generate unique filename
    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;

    // 11. Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "providers",
      userId,
      "portfolio",
    );
    await mkdir(uploadDir, { recursive: true });

    // 12. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 13. Build relative URL for serving
    const relativeUrl = `/uploads/providers/${userId}/portfolio/${filename}`;

    // 14. Determine next sortOrder
    const maxSortOrderResult = await prisma.portfolioPhoto.aggregate({
      where: { providerId, isDeleted: false },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrderResult._max.sortOrder ?? -1) + 1;

    // 15. Create portfolio photo record
    const photo = await prisma.portfolioPhoto.create({
      data: {
        providerId,
        photoUrl: relativeUrl,
        caption,
        sortOrder: nextSortOrder,
      },
      select: { id: true, photoUrl: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: photo.id, photoUrl: photo.photoUrl },
    });
  } catch (error) {
    console.error("[POST /api/provider/portfolio] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/provider/portfolio
 * Remove a portfolio photo (soft delete + physical file removal).
 * Body: { photoId: string }
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifie" },
        { status: 401 },
      );
    }

    // 2. Check role is PROVIDER
    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Acces reserve aux prestataires" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    // 3. Parse JSON body
    let photoId: string;
    try {
      const body = await request.json() as { photoId?: unknown };
      if (!body.photoId || typeof body.photoId !== "string") {
        return NextResponse.json(
          { success: false, error: "photoId est requis" },
          { status: 400 },
        );
      }
      photoId = body.photoId;
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de la requete invalide" },
        { status: 400 },
      );
    }

    // 4. Get provider record
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Profil prestataire introuvable" },
        { status: 404 },
      );
    }

    // 5. Verify ownership and get photo
    const photo = await prisma.portfolioPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, providerId: true, photoUrl: true },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo introuvable" },
        { status: 404 },
      );
    }

    if (photo.providerId !== provider.id) {
      return NextResponse.json(
        { success: false, error: "Acces interdit" },
        { status: 403 },
      );
    }

    // 6. Soft delete the record
    await prisma.portfolioPhoto.update({
      where: { id: photoId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // 7. Delete physical file (best effort)
    try {
      const filePath = path.join(process.cwd(), "public", photo.photoUrl);
      await unlink(filePath);
    } catch {
      console.warn(
        `[DELETE /api/provider/portfolio] Could not delete physical file: ${photo.photoUrl}`,
      );
    }

    return NextResponse.json({
      success: true,
      data: { removed: photoId },
    });
  } catch (error) {
    console.error("[DELETE /api/provider/portfolio] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
