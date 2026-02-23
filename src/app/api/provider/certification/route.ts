import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allowed MIME types for certifications (images + PDF)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

// 10MB max for certificates (PDF can be large)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// ============================================================
// POST /api/provider/certification — Upload a certification or diploma
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
    const title = formData.get("title");

    // 4. Validate title
    if (
      !title ||
      typeof title !== "string" ||
      title.trim().length < 2 ||
      title.trim().length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Le titre est requis (2–200 caractères)",
        },
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
        {
          success: false,
          error: "Formats acceptés : JPG, PNG, WebP et PDF",
        },
        { status: 400 },
      );
    }

    // 7. Validate file size (10MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas dépasser 10 Mo" },
        { status: 400 },
      );
    }

    // 8. Get provider record
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

    // 9. Generate UUID filename with extension
    const extension = mimeToExtension[file.type] ?? "pdf";
    const filename = `${crypto.randomUUID()}.${extension}`;

    // 10. Create directory if not exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "providers",
      userId,
      "certs",
    );
    await mkdir(uploadDir, { recursive: true });

    // 11. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 12. Build relative URL
    const relativeUrl = `/uploads/providers/${userId}/certs/${filename}`;

    // 13. Create certification record in DB
    const cert = await prisma.certification.create({
      data: {
        providerId: provider.id,
        title: title.trim(),
        fileUrl: relativeUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: cert.id,
        fileUrl: relativeUrl,
      },
    });
  } catch (error) {
    console.error("[POST /api/provider/certification] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload de la certification" },
      { status: 500 },
    );
  }
}
