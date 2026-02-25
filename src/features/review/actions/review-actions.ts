"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import type { Review } from "@prisma/client";

import { moderateReviewContent } from "../lib/moderation";
import { reviewSubmitSchema, type ReviewSubmitInput } from "../schemas/review";

// ============================================================
// HELPERS
// ============================================================

/**
 * Recomputes the average rating for a provider and updates the provider record.
 * Called after both parties have reviewed a booking (double-blind publish).
 */
export async function updateProviderRating(providerId: string): Promise<void> {
  // Fetch all published, non-deleted reviews targeting this provider's userId
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });

  if (!provider) return;

  const reviews = await prisma.review.findMany({
    where: {
      targetId: provider.userId,
      published: true,
      flagged: false,
      isDeleted: false,
    },
    select: { stars: true },
  });

  if (reviews.length === 0) {
    await prisma.provider.update({
      where: { id: providerId },
      data: { rating: 0, ratingCount: 0 },
    });
    return;
  }

  const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
  const averageRating = totalStars / reviews.length;

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: reviews.length,
    },
  });
}

/**
 * Publishes both reviews for a booking (double-blind system).
 * Called when both the client and provider have submitted their review.
 */
async function publishBothReviews(bookingId: string, providerId: string): Promise<void> {
  const now = new Date();

  // Publish both reviews atomically
  await prisma.review.updateMany({
    where: {
      bookingId,
      published: false,
      isDeleted: false,
    },
    data: {
      published: true,
      publishedAt: now,
    },
  });

  // Recompute provider rating after publishing
  await updateProviderRating(providerId);
}

// ============================================================
// SUBMIT REVIEW ACTION
// ============================================================

/**
 * Server action: Submit a review for a completed booking.
 *
 * Rules:
 * - Session required (client or provider)
 * - Booking must be COMPLETED
 * - Author must be the client or provider of that booking
 * - 10-day review window after completedAt
 * - No duplicate reviews (@@unique([bookingId, authorId]))
 * - Auto-moderation: flags contact info and spam
 * - Double-blind: review publishes only when both parties review
 */
export async function submitReviewAction(
  data: ReviewSubmitInput,
): Promise<ActionResult<Review>> {
  try {
    // 1. Validate input with Zod schema
    const parsed = reviewSubmitSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Données de formulaire invalides",
      };
    }

    const validData = parsed.data;

    // 2. Verify session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté pour laisser un avis" };
    }

    const authorId = session.user.id;

    // 3. Fetch the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: validData.bookingId,
        isDeleted: false,
      },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
        completedAt: true,
        provider: {
          select: { userId: true },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Réservation introuvable" };
    }

    // 4. Verify author is part of this booking
    const isClient = booking.clientId === authorId;
    const isProvider = booking.provider.userId === authorId;

    if (!isClient && !isProvider) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à évaluer cette réservation",
      };
    }

    // 5. Verify booking is COMPLETED
    if (booking.status !== "COMPLETED") {
      return {
        success: false,
        error: "Vous ne pouvez évaluer que les réservations terminées",
      };
    }

    // 6. Verify 10-day review window
    if (!booking.completedAt) {
      return { success: false, error: "Date de completion de la réservation introuvable" };
    }

    const windowDeadline = new Date(booking.completedAt);
    windowDeadline.setDate(windowDeadline.getDate() + 10);
    const now = new Date();

    if (now > windowDeadline) {
      return {
        success: false,
        error:
          "La période d'évaluation est terminée (10 jours après la fin du service)",
      };
    }

    // 7. Check for existing review from this author on this booking
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId: validData.bookingId,
        authorId,
        isDeleted: false,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: "Vous avez déjà laissé un avis pour cette réservation",
      };
    }

    // 8. Run auto-moderation
    const moderation = moderateReviewContent(validData.text);

    // 9. Determine targetId (who is being reviewed)
    // Client reviews the provider (target = provider's userId)
    // Provider reviews the client (target = clientId)
    const targetId = isClient ? booking.provider.userId : booking.clientId;

    // Determine authorRole string for DB
    const reviewAuthorRole = isClient ? "CLIENT" : "PROVIDER";

    // 10. Create the review
    const review = await prisma.review.create({
      data: {
        bookingId: validData.bookingId,
        authorId,
        targetId,
        authorRole: reviewAuthorRole,
        stars: validData.stars,
        qualityRating: validData.qualityRating,
        punctualityRating: validData.punctualityRating,
        communicationRating: validData.communicationRating,
        cleanlinessRating: validData.cleanlinessRating,
        text: validData.text,
        photoUrls: validData.photoUrls,
        flagged: moderation.flagged,
        flaggedReason: moderation.reason,
        moderatedAt: moderation.flagged ? now : null,
        published: false, // Will be set to true when both parties review
      },
    });

    // 11. Check if both reviews now exist for this booking
    const allReviews = await prisma.review.findMany({
      where: {
        bookingId: validData.bookingId,
        isDeleted: false,
      },
      select: { authorId: true, authorRole: true },
    });

    const hasClientReview = allReviews.some((r) => r.authorRole === "CLIENT");
    const hasProviderReview = allReviews.some((r) => r.authorRole === "PROVIDER");

    if (hasClientReview && hasProviderReview) {
      // Both parties reviewed — publish both reviews and update provider rating
      await publishBothReviews(validData.bookingId, booking.providerId);
    }

    return { success: true, data: review };
  } catch (error) {
    console.error("[submitReviewAction] Error:", error);
    return { success: false, error: "Erreur lors de la soumission de l'avis" };
  }
}
