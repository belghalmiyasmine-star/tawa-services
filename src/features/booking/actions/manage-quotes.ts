"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  createQuoteSchema,
  respondQuoteSchema,
  acceptQuoteSchema,
} from "@/lib/validations/booking";

// ============================================================
// ACTION 1: createQuoteAction
// ============================================================

/**
 * Client submits a quote request for a "sur devis" service.
 *
 * - Validates CLIENT role session
 * - Verifies service exists, is ACTIVE, and pricingType is SUR_DEVIS
 * - Creates Quote with status PENDING, expiresAt = now + 48h
 */
export async function createQuoteAction(
  data: unknown,
): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;

    const parsed = createQuoteSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const {
      serviceId,
      description,
      preferredDate,
      address,
      city,
      budget,
    } = parsed.data;

    // Fetch service
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isDeleted: false },
      include: {
        provider: {
          select: { userId: true },
        },
      },
    });

    if (!service) {
      return { success: false, error: "Service introuvable" };
    }

    if (service.status !== "ACTIVE") {
      return { success: false, error: "Ce service n'est pas disponible" };
    }

    if (service.pricingType !== "SUR_DEVIS") {
      return {
        success: false,
        error: "Ce service ne supporte pas les demandes de devis",
      };
    }

    // Prevent requesting a quote from own service
    if (service.provider.userId === userId) {
      return {
        success: false,
        error: "Vous ne pouvez pas demander un devis pour votre propre service",
      };
    }

    // Quote expires after 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        clientId: userId,
        serviceId,
        status: "PENDING",
        description,
        address,
        city,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        budget: budget ?? null,
        expiresAt,
      },
    });

    return { success: true, data: { quoteId: quote.id } };
  } catch (error) {
    console.error("[createQuoteAction] Error:", error);
    return { success: false, error: "Erreur lors de la creation du devis" };
  }
}

// ============================================================
// ACTION 2: respondQuoteAction
// ============================================================

/**
 * Provider responds to a pending quote with proposed price and optional delay.
 *
 * - Validates PROVIDER role session
 * - Verifies quote belongs to provider (via service.provider.userId)
 * - Verifies status is PENDING and quote is not expired
 * - Transitions status to RESPONDED, stores proposedPrice and proposedDelay
 */
export async function respondQuoteAction(
  data: unknown,
): Promise<ActionResult<{ success: true }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const parsed = respondQuoteSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const { quoteId, proposedPrice, proposedDelay } = parsed.data;

    // Fetch quote with service and provider info
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, isDeleted: false },
      include: {
        service: {
          include: {
            provider: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!quote) {
      return { success: false, error: "Devis introuvable" };
    }

    // Verify ownership
    if (quote.service.provider.userId !== userId) {
      return { success: false, error: "Acces refuse" };
    }

    if (quote.status !== "PENDING") {
      return {
        success: false,
        error: "Seuls les devis en attente peuvent recevoir une reponse",
      };
    }

    // Check expiry
    if (new Date() > quote.expiresAt) {
      return { success: false, error: "Ce devis a expire" };
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "RESPONDED",
        proposedPrice,
        proposedDelay: proposedDelay ?? null,
        respondedAt: new Date(),
      },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[respondQuoteAction] Error:", error);
    return { success: false, error: "Erreur lors de la reponse au devis" };
  }
}

// ============================================================
// ACTION 3: acceptQuoteAction
// ============================================================

/**
 * Client accepts a responded quote and schedules the booking.
 *
 * - Validates CLIENT role session
 * - Verifies quote belongs to client (clientId), status is RESPONDED
 * - In a transaction: update quote to ACCEPTED + create Booking (PENDING) + create Payment (PENDING)
 */
export async function acceptQuoteAction(
  data: unknown,
): Promise<ActionResult<{ bookingId: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;

    const parsed = acceptQuoteSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const { quoteId, scheduledAt: scheduledAtStr, paymentMethod } = parsed.data;
    const scheduledAt = new Date(scheduledAtStr);

    // Fetch quote
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        clientId: userId,
        isDeleted: false,
      },
      include: {
        service: {
          include: {
            provider: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!quote) {
      return { success: false, error: "Devis introuvable ou acces refuse" };
    }

    if (quote.status !== "RESPONDED") {
      return {
        success: false,
        error: "Seuls les devis avec reponse peuvent etre acceptes",
      };
    }

    // Check expiry
    if (new Date() > quote.expiresAt) {
      return { success: false, error: "Ce devis a expire" };
    }

    const totalAmount = quote.proposedPrice ?? 0;
    const providerId = quote.service.provider.id;

    const result = await prisma.$transaction(async (tx) => {
      // Accept the quote
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      // Create booking linked to the quote
      const booking = await tx.booking.create({
        data: {
          clientId: userId,
          providerId,
          serviceId: quote.serviceId,
          quoteId,
          status: "PENDING",
          scheduledAt,
          totalAmount,
        },
      });

      // Create payment
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          method: paymentMethod,
          status: "PENDING",
          amount: totalAmount,
        },
      });

      return booking;
    });

    return { success: true, data: { bookingId: result.id } };
  } catch (error) {
    console.error("[acceptQuoteAction] Error:", error);
    return { success: false, error: "Erreur lors de l'acceptation du devis" };
  }
}

// ============================================================
// ACTION 4: declineQuoteAction
// ============================================================

/**
 * Client declines a responded quote.
 *
 * - Validates CLIENT role session
 * - Verifies quote belongs to client, status is RESPONDED
 * - Transitions status to DECLINED
 */
export async function declineQuoteAction(
  quoteId: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;

    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        clientId: userId,
        isDeleted: false,
      },
    });

    if (!quote) {
      return { success: false, error: "Devis introuvable ou acces refuse" };
    }

    if (quote.status !== "RESPONDED") {
      return {
        success: false,
        error: "Seuls les devis avec reponse peuvent etre declines",
      };
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "DECLINED" },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[declineQuoteAction] Error:", error);
    return { success: false, error: "Erreur lors du refus du devis" };
  }
}
