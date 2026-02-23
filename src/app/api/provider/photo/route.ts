import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allowed MIME types for profile photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/provider/photo
 * Upload or replace provider profile photo.
 * Stores to /public/uploads/providers/[userId]/avatar-[uuid].[ext]
 * Updates provider.photoUrl in the database.
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

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    // 4. Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // 5. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Format accepte: JPEG, PNG, WebP" },
        { status: 400 },
      );
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas depasser 5 Mo" },
        { status: 400 },
      );
    }

    // 7. Get provider record
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

    // 8. Generate unique filename
    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `avatar-${crypto.randomUUID()}.${extension}`;

    // 9. Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "providers",
      userId,
    );
    await mkdir(uploadDir, { recursive: true });

    // 10. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 11. Build relative URL for serving
    const relativePath = `/uploads/providers/${userId}/${filename}`;

    // 12. Update provider photoUrl in database
    await prisma.provider.update({
      where: { userId },
      data: { photoUrl: relativePath },
    });

    return NextResponse.json({
      success: true,
      data: { photoUrl: relativePath },
    });
  } catch (error) {
    console.error("[POST /api/provider/photo] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 },
    );
  }
}
