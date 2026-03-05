import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ============================================================
// POST /api/messages/upload — Upload an image for chat messages
// ============================================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers JPG, PNG et WebP sont acceptés" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas dépasser 5 Mo" },
        { status: 400 },
      );
    }

    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
    await mkdir(uploadDir, { recursive: true });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    const imageUrl = `/uploads/messages/${filename}`;

    return NextResponse.json({
      success: true,
      data: { imageUrl },
    });
  } catch (error) {
    console.error("[POST /api/messages/upload] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload de l'image" },
      { status: 500 },
    );
  }
}
