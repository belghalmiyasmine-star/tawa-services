"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

export type KycSubmissionSummary = {
  providerId: string;
  displayName: string;
  email: string;
  phone: string | null;
  registeredAt: Date;
  submittedAt: Date;
  documentCount: number;
  isOverdue: boolean;
};

export type KycDocumentDetail = {
  docType: string;
  fileUrl: string;
  uploadedAt: Date;
};

export type KycSubmissionDetail = {
  providerId: string;
  displayName: string;
  email: string;
  phone: string | null;
  registeredAt: Date;
  submittedAt: Date;
  kycStatus: string;
  documents: KycDocumentDetail[];
  isOverdue: boolean;
};

// ============================================================
// VALID REJECTION REASONS
// ============================================================

const VALID_REJECTION_REASONS = [
  "illegible",
  "nonConforming",
  "mismatch",
  "other",
] as const;

type RejectionReason = (typeof VALID_REJECTION_REASONS)[number];

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Approve a KYC submission.
 * Sets kycStatus to APPROVED, creates IDENTITY_VERIFIED TrustBadge,
 * and sends a KYC_APPROVED notification to the provider.
 */
export async function approveKycAction(
  providerId: string,
): Promise<ActionResult<{ providerId: string }>> {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Role check
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }

  try {
    // 3. Find provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        userId: true,
        kycStatus: true,
      },
    });

    if (!provider) {
      return { success: false, error: "Prestataire introuvable" };
    }

    // 4. Verify status is PENDING
    if (provider.kycStatus !== "PENDING") {
      return {
        success: false,
        error: "Ce dossier n'est pas en attente de verification",
      };
    }

    // 5. Atomic transaction: update provider + create badge + create notification
    await prisma.$transaction(async (tx) => {
      // Update provider kycStatus to APPROVED
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          kycStatus: "APPROVED",
          kycApprovedAt: new Date(),
          kycRejectedAt: null,
          kycRejectedReason: null,
        },
      });

      // Upsert IDENTITY_VERIFIED TrustBadge to avoid duplicate constraint violation
      await tx.trustBadge.upsert({
        where: {
          providerId_badgeType: {
            providerId: provider.id,
            badgeType: "IDENTITY_VERIFIED",
          },
        },
        create: {
          providerId: provider.id,
          badgeType: "IDENTITY_VERIFIED",
          isActive: true,
        },
        update: {
          isActive: true,
          awardedAt: new Date(),
        },
      });

      // Create KYC_APPROVED notification
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "KYC_APPROVED",
          title: "Votre identite a ete verifiee",
          body: "Felicitations ! Vous pouvez maintenant proposer vos services.",
        },
      });
    });

    return { success: true, data: { providerId: provider.id } };
  } catch (error) {
    console.error("[approveKycAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Reject a KYC submission with a structured reason.
 * Sets kycStatus to REJECTED with reason + optional comment,
 * and sends a KYC_REJECTED notification to the provider.
 */
export async function rejectKycAction(data: {
  providerId: string;
  reason: string;
  comment?: string;
}): Promise<ActionResult<{ providerId: string }>> {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Role check
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }

  // 3. Validate rejection reason
  if (!VALID_REJECTION_REASONS.includes(data.reason as RejectionReason)) {
    return { success: false, error: "Raison de rejet invalide" };
  }

  try {
    // 4. Find provider
    const provider = await prisma.provider.findUnique({
      where: { id: data.providerId },
      select: {
        id: true,
        userId: true,
        kycStatus: true,
      },
    });

    if (!provider) {
      return { success: false, error: "Prestataire introuvable" };
    }

    // 5. Verify status is PENDING
    if (provider.kycStatus !== "PENDING") {
      return {
        success: false,
        error: "Ce dossier n'est pas en attente de verification",
      };
    }

    // 6. Combine reason + optional comment
    const rejectionReason = data.comment
      ? `${data.reason}: ${data.comment}`
      : data.reason;

    // 7. Atomic transaction: update provider + create notification
    await prisma.$transaction(async (tx) => {
      // Update provider kycStatus to REJECTED
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          kycStatus: "REJECTED",
          kycRejectedAt: new Date(),
          kycRejectedReason: rejectionReason,
        },
      });

      // Create KYC_REJECTED notification
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "KYC_REJECTED",
          title: "Verification d'identite rejetee",
          body: `Votre dossier a ete rejete. Motif: ${rejectionReason}`,
        },
      });
    });

    return { success: true, data: { providerId: provider.id } };
  } catch (error) {
    console.error("[rejectKycAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Get all pending KYC submissions sorted by submission date (oldest first).
 * Computes isOverdue flag for submissions older than 48h.
 */
export async function getKycSubmissions(): Promise<
  ActionResult<KycSubmissionSummary[]>
> {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Role check
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }

  try {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const providers = await prisma.provider.findMany({
      where: {
        kycStatus: "PENDING",
        isDeleted: false,
      },
      orderBy: {
        kycSubmittedAt: "asc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        kycDocuments: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    const submissions: KycSubmissionSummary[] = providers.map((provider) => ({
      providerId: provider.id,
      displayName: provider.displayName,
      email: provider.user.email,
      phone: provider.user.phone ?? null,
      registeredAt: provider.user.createdAt,
      submittedAt: provider.kycSubmittedAt!,
      documentCount: provider.kycDocuments.length,
      isOverdue: provider.kycSubmittedAt
        ? provider.kycSubmittedAt < overdueThreshold
        : false,
    }));

    return { success: true, data: submissions };
  } catch (error) {
    console.error("[getKycSubmissions] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}

/**
 * Get full detail for a single KYC submission including all documents.
 */
export async function getKycSubmissionDetail(
  providerId: string,
): Promise<ActionResult<KycSubmissionDetail>> {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }

  // 2. Role check
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }

  try {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const provider = await prisma.provider.findUnique({
      where: { id: providerId, isDeleted: false },
      include: {
        user: true,
        kycDocuments: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!provider) {
      return { success: false, error: "Prestataire introuvable" };
    }

    const detail: KycSubmissionDetail = {
      providerId: provider.id,
      displayName: provider.displayName,
      email: provider.user.email,
      phone: provider.user.phone ?? null,
      registeredAt: provider.user.createdAt,
      submittedAt: provider.kycSubmittedAt!,
      kycStatus: provider.kycStatus,
      documents: provider.kycDocuments.map((doc) => ({
        docType: doc.docType,
        fileUrl: doc.fileUrl,
        uploadedAt: doc.uploadedAt,
      })),
      isOverdue: provider.kycSubmittedAt
        ? provider.kycSubmittedAt < overdueThreshold
        : false,
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error("[getKycSubmissionDetail] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
