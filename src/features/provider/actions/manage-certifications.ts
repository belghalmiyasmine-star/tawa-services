"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

interface CertificationData {
  id: string;
  providerId: string;
  title: string;
  fileUrl: string;
  issuedAt: Date | null;
  createdAt: Date;
}

// ============================================================
// ACTION 1: addCertificationAction
// ============================================================

export async function addCertificationAction(data: {
  title: string;
  fileUrl: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // Validate title
    if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 200) {
      return { success: false, error: "Le titre est requis (2–200 caractères)" };
    }

    // Validate fileUrl
    if (!data.fileUrl || data.fileUrl.trim() === "") {
      return { success: false, error: "L'URL du fichier est requise" };
    }

    // Fetch provider record
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const cert = await prisma.certification.create({
      data: {
        providerId: provider.id,
        title: data.title.trim(),
        fileUrl: data.fileUrl.trim(),
      },
    });

    return { success: true, data: { id: cert.id } };
  } catch (error) {
    console.error("[addCertificationAction] Error:", error);
    return { success: false, error: "Erreur lors de l'ajout de la certification" };
  }
}

// ============================================================
// ACTION 2: deleteCertificationAction (soft delete)
// ============================================================

export async function deleteCertificationAction(
  certificationId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // Verify ownership — certification belongs to provider belonging to session user
    const cert = await prisma.certification.findFirst({
      where: {
        id: certificationId,
        provider: { userId },
        isDeleted: false,
      },
    });

    if (!cert) {
      return { success: false, error: "Certification introuvable ou accès refusé" };
    }

    // Soft delete
    await prisma.certification.update({
      where: { id: certificationId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true, data: { id: certificationId } };
  } catch (error) {
    console.error("[deleteCertificationAction] Error:", error);
    return { success: false, error: "Erreur lors de la suppression de la certification" };
  }
}

// ============================================================
// ACTION 3: getProviderCertificationsAction
// ============================================================

export async function getProviderCertificationsAction(): Promise<
  ActionResult<CertificationData[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    const certifications = await prisma.certification.findMany({
      where: {
        provider: { userId },
        isDeleted: false,
      },
      select: {
        id: true,
        providerId: true,
        title: true,
        fileUrl: true,
        issuedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: certifications };
  } catch (error) {
    console.error("[getProviderCertificationsAction] Error:", error);
    return { success: false, error: "Erreur lors de la récupération des certifications" };
  }
}
