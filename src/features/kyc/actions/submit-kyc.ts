"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kycSubmissionSchema } from "@/lib/validations/kyc";
import type { ActionResult } from "@/types/api";

/**
 * Server action for KYC document submission.
 * Validates input, checks provider status, atomically creates
 * KYCDocument records and updates provider kycStatus to PENDING.
 */
export async function submitKycAction(
  data: unknown,
): Promise<ActionResult<{ providerId: string }>> {
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

  // 3. Parse and validate input with Zod schema
  const parsed = kycSubmissionSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const documents = parsed.data;

  try {
    // 4. Find provider by userId
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: {
        id: true,
        kycStatus: true,
      },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // 5. Check if already submitted (PENDING or APPROVED)
    if (
      provider.kycStatus === "PENDING" ||
      provider.kycStatus === "APPROVED"
    ) {
      return { success: false, error: "Vous avez deja soumis vos documents" };
    }

    const isResubmission = provider.kycStatus === "REJECTED";

    // 6. Atomically create/update KYC records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing KYCDocument records for re-submission after REJECTED
      if (isResubmission) {
        await tx.kYCDocument.deleteMany({
          where: { providerId: provider.id },
        });
      }

      // Create 4 KYCDocument records
      await tx.kYCDocument.createMany({
        data: documents.map((doc) => ({
          providerId: provider.id,
          docType: doc.docType,
          fileUrl: doc.fileUrl,
        })),
      });

      // Update provider kycStatus to PENDING
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          kycStatus: "PENDING",
          kycSubmittedAt: new Date(),
          // Clear rejection data on re-submission
          ...(isResubmission && {
            kycRejectedAt: null,
            kycRejectedReason: null,
          }),
        },
      });
    });

    return { success: true, data: { providerId: provider.id } };
  } catch (error) {
    console.error("[submitKycAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
