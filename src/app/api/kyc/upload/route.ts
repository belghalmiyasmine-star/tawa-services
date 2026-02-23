import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_MIME_TYPES,
  KYC_DOC_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations/kyc";

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
    const docType = formData.get("docType");

    // 4. Validate docType
    if (
      !docType ||
      typeof docType !== "string" ||
      !KYC_DOC_TYPES.includes(docType as (typeof KYC_DOC_TYPES)[number])
    ) {
      return NextResponse.json(
        { success: false, error: "Type de document invalide" },
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
    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers JPG et PNG sont acceptes" },
        { status: 400 },
      );
    }

    // 7. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas depasser 5 Mo" },
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

    // 9. Generate UUID filename with original extension
    const mimeToExtension: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
    };
    const extension = mimeToExtension[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;

    // 10. Create directory if not exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "kyc",
      userId,
    );
    await mkdir(uploadDir, { recursive: true });

    // 11. Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    // 12. Return success with fileUrl
    const fileUrl = `/uploads/kyc/${userId}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        docType,
      },
    });
  } catch (error) {
    console.error("[POST /api/kyc/upload] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 },
    );
  }
}
