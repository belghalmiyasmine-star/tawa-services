import crypto from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SERVICE_PHOTOS } from "@/lib/constants";

// Allowed MIME types for service photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ============================================================
// POST /api/service/photos — Upload a work photo for a service
// ============================================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    // 2. Check role is PROVIDER
    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux prestataires" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const serviceId = formData.get("serviceId");

    // 4. Validate serviceId
    if (!serviceId || typeof serviceId !== "string" || serviceId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "L'identifiant du service est requis" },
        { status: 400 },
      );
    }

    // 5. Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // 6. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers JPG, PNG et WebP sont acceptés" },
        { status: 400 },
      );
    }

    // 7. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas dépasser 5 Mo" },
        { status: 400 },
      );
    }

    // 8. Verify service ownership
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        provider: { userId },
        isDeleted: false,
      },
      select: { id: true, photoUrls: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service introuvable ou accès refusé" },
        { status: 404 },
      );
    }

    // 9. Check max photos limit
    if (service.photoUrls.length >= MAX_SERVICE_PHOTOS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_SERVICE_PHOTOS} photos par service` },
        { status: 400 },
      );
    }

    // 10. Generate UUID filename with extension
    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;

    // 11. Create directory if not exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "services",
      serviceId,
    );
    await mkdir(uploadDir, { recursive: true });

    // 12. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 13. Build relative URL and update service
    const relativeUrl = `/uploads/services/${serviceId}/${filename}`;

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { photoUrls: { push: relativeUrl } },
      select: { photoUrls: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        photoUrl: relativeUrl,
        totalPhotos: updatedService.photoUrls.length,
      },
    });
  } catch (error) {
    console.error("[POST /api/service/photos] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload de la photo" },
      { status: 500 },
    );
  }
}

// ============================================================
// DELETE /api/service/photos — Remove a work photo from a service
// ============================================================

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    // 2. Check role is PROVIDER
    if (session.user.role !== "PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux prestataires" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    // 3. Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de la requête invalide" },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).serviceId !== "string" ||
      typeof (body as Record<string, unknown>).photoUrl !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "serviceId et photoUrl sont requis" },
        { status: 400 },
      );
    }

    const { serviceId, photoUrl } = body as { serviceId: string; photoUrl: string };

    // 4. Verify service ownership
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        provider: { userId },
        isDeleted: false,
      },
      select: { id: true, photoUrls: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service introuvable ou accès refusé" },
        { status: 404 },
      );
    }

    // 5. Remove photo from array
    const newPhotoUrls = service.photoUrls.filter((url) => url !== photoUrl);

    await prisma.service.update({
      where: { id: serviceId },
      data: { photoUrls: newPhotoUrls },
    });

    // 6. Delete physical file (best effort — don't fail if file missing)
    try {
      const physicalPath = path.join(process.cwd(), "public", photoUrl);
      await unlink(physicalPath);
    } catch {
      // File may already be gone — not critical
      console.warn("[DELETE /api/service/photos] File not found on disk:", photoUrl);
    }

    return NextResponse.json({
      success: true,
      data: { removed: photoUrl },
    });
  } catch (error) {
    console.error("[DELETE /api/service/photos] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de la photo" },
      { status: 500 },
    );
  }
}
