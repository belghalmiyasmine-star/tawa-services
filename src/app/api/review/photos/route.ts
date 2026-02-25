import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

// Allowed MIME types for review photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ============================================================
// POST /api/review/photos — Upload a photo for a review
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

    const userId = session.user.id;

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    // 3. Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // 4. Validate MIME type (images only)
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers JPG, PNG et WebP sont acceptés" },
        { status: 400 },
      );
    }

    // 5. Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas dépasser 5 Mo" },
        { status: 400 },
      );
    }

    // 6. Generate unique filename with extension
    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;

    // 7. Create user-specific upload directory if not exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "reviews",
      userId,
    );
    await mkdir(uploadDir, { recursive: true });

    // 8. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 9. Build and return relative URL
    // Max 3 photos per review is enforced at the schema/action level (not API route level)
    const relativeUrl = `/uploads/reviews/${userId}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: relativeUrl,
      },
    });
  } catch (error) {
    console.error("[POST /api/review/photos] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload de la photo" },
      { status: 500 },
    );
  }
}
