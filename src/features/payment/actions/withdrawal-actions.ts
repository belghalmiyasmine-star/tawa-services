"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

export interface WithdrawalRequestItem {
  id: string;
  amount: number;
  status: string;
  requestedAt: Date;
  processedAt: Date | null;
}

// ============================================================
// ACTION 1: requestWithdrawalAction
// ============================================================

/**
 * Creates a withdrawal request for the authenticated provider.
 *
 * - Validates PROVIDER session
 * - Enforces minimum 50 TND threshold
 * - Checks available balance (RELEASED payments without withdrawal request)
 * - Creates a WithdrawalRequest linked to the oldest available RELEASED payment
 */
export async function requestWithdrawalAction(
  amount: number,
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    // Validate minimum amount
    if (!amount || amount < 50) {
      return { success: false, error: "Le montant minimum de retrait est de 50 TND" };
    }

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    // Calculate available balance: RELEASED payments with no withdrawal request
    const availableAggregate = await prisma.payment.aggregate({
      where: {
        booking: { providerId },
        status: "RELEASED",
        isDeleted: false,
        withdrawalRequest: null,
      },
      _sum: {
        providerEarning: true,
      },
    });

    const available = availableAggregate._sum.providerEarning ?? 0;

    if (available < amount) {
      return { success: false, error: "Solde insuffisant" };
    }

    // Find the oldest RELEASED payment without a withdrawal request (FIFO)
    const oldestPayment = await prisma.payment.findFirst({
      where: {
        booking: { providerId },
        status: "RELEASED",
        isDeleted: false,
        withdrawalRequest: null,
      },
      orderBy: { releasedAt: "asc" },
      select: { id: true },
    });

    if (!oldestPayment) {
      return { success: false, error: "Aucun paiement disponible pour le retrait" };
    }

    // Create withdrawal request linked to the oldest available payment
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        providerId,
        paymentId: oldestPayment.id,
        amount,
        status: "PENDING",
      },
    });

    return { success: true, data: { requestId: withdrawalRequest.id } };
  } catch (error) {
    console.error("[requestWithdrawalAction] Error:", error);
    return { success: false, error: "Erreur lors de la demande de retrait" };
  }
}

// ============================================================
// ACTION 2: getWithdrawalRequestsAction
// ============================================================

/**
 * Returns all withdrawal requests for the authenticated provider.
 */
export async function getWithdrawalRequestsAction(): Promise<
  ActionResult<WithdrawalRequestItem[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const providerId = provider.id;

    const requests = await prisma.withdrawalRequest.findMany({
      where: {
        providerId,
        isDeleted: false,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
        processedAt: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    return {
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
        requestedAt: r.requestedAt,
        processedAt: r.processedAt,
      })),
    };
  } catch (error) {
    console.error("[getWithdrawalRequestsAction] Error:", error);
    return { success: false, error: "Erreur lors de la recuperation des demandes de retrait" };
  }
}
