"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import type { Review } from "@prisma/client";

import { moderateReviewContent } from "../lib/moderation";
import {
  isReviewWindowOpen,
  publishBothReviews,
  updateProviderRating,
} from "../lib/publication";
import { reviewSubmitSchema, type ReviewSubmitInput } from "../schemas/review";
import { sendNotificationBatch } from "@/features/notification/lib/send-notification";
import { analyzeReview } from "@/lib/ai/review-analyzer";

// Re-export updateProviderRating so existing imports from this module continue to work
export { updateProviderRating };

// ============================================================
// MODERATE REVIEW ACTION (Admin only)
// ============================================================

/**
 * Admin action to approve or reject a flagged review.
 *
 * - approve: clears the flagged state, keeps published status (if already published)
 * - reject: soft-deletes the review, recalculates provider rating if the review was published
 */
export async function moderateReviewAction(
  reviewId: string,
  action: "approve" | "reject",
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Accès réservé aux administrateurs" };
    }

    const review = await prisma.review.findFirst({
      where: { id: reviewId, isDeleted: false },
      select: {
        id: true,
        published: true,
        booking: { select: { providerId: true } },
      },
    });

    if (!review) {
      return { success: false, error: "Avis introuvable" };
    }

    const now = new Date();

    if (action === "approve") {
      // Clear flag — review becomes visible if it was already published
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          flagged: false,
          moderatedAt: now,
        },
      });
    } else {
      // Soft-delete the review
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          isDeleted: true,
          deletedAt: now,
          moderatedAt: now,
        },
      });

      // Recalculate provider rating if the review was published
      if (review.published && review.booking.providerId) {
        await updateProviderRating(review.booking.providerId);
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[moderateReviewAction] Error:", error);
    return { success: false, error: "Erreur lors de la modération de l'avis" };
  }
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

    // 6. Verify 10-day review window using shared isReviewWindowOpen helper
    if (!booking.completedAt) {
      return { success: false, error: "Date de completion de la réservation introuvable" };
    }

    const { open: windowOpen } = isReviewWindowOpen({
      completedAt: booking.completedAt,
      status: booking.status,
    });

    if (!windowOpen) {
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

    // 8. Run auto-moderation + AI sentiment analysis
    const now = new Date();
    const moderation = moderateReviewContent(validData.text);
    const analysis = analyzeReview(validData.text, validData.stars);

    // Merge flagging: flagged if either moderation or AI flags it
    const isFlagged = moderation.flagged || analysis.flagged;
    const flaggedReason = [moderation.reason, ...analysis.reasons]
      .filter(Boolean)
      .join(" | ") || null;

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
        sentiment: analysis.sentiment,
        flagged: isFlagged,
        flaggedReason,
        moderatedAt: isFlagged ? now : null,
        published: false, // Will be set to true when both parties review
      },
    });

    // 10b. Auto-create report if AI flagged the review
    if (analysis.flagged && analysis.severity) {
      const priorityMap = {
        CRITICAL: "CRITICAL" as const,
        IMPORTANT: "IMPORTANT" as const,
        MINOR: "MINOR" as const,
      };
      const slaHoursMap = { CRITICAL: 2, IMPORTANT: 24, MINOR: 48 };
      const slaHours = slaHoursMap[analysis.severity];
      const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

      await prisma.report.create({
        data: {
          reporterId: authorId,
          reportedId: targetId,
          type: "REVIEW",
          reason: analysis.reasons.join(", "),
          description: `Auto-signalement IA: ${analysis.reasons.join(", ")}. Sentiment: ${analysis.sentiment}. Severite: ${analysis.severity}.`,
          priority: priorityMap[analysis.severity],
          status: "OPEN",
          referenceId: review.id,
          slaDeadline,
        },
      });
    }

    // 11. Attempt double-blind publication:
    //     publishBothReviews checks internally if both CLIENT and PROVIDER reviews
    //     exist — it publishes only when both are present.
    await publishBothReviews(validData.bookingId);

    // Re-fetch the review to get the updated published status after publication
    const updatedReview = await prisma.review.findUnique({
      where: { id: review.id },
    });

    // 12. If reviews were published (both parties reviewed), notify both parties
    if (updatedReview?.published) {
      // Fetch booking parties for notification
      const bookingForNotif = await prisma.booking.findUnique({
        where: { id: validData.bookingId },
        select: {
          clientId: true,
          provider: { select: { userId: true } },
          service: { select: { title: true } },
        },
      });

      if (bookingForNotif) {
        void sendNotificationBatch([
          {
            userId: bookingForNotif.clientId,
            type: "REVIEW_RECEIVED",
            title: "Nouvel avis recu",
            body: bookingForNotif.service.title,
            data: { bookingId: validData.bookingId, reviewId: review.id },
          },
          {
            userId: bookingForNotif.provider.userId,
            type: "REVIEW_RECEIVED",
            title: "Nouvel avis recu",
            body: bookingForNotif.service.title,
            data: { bookingId: validData.bookingId, reviewId: review.id },
          },
        ]);
      }
    }

    return { success: true, data: updatedReview ?? review };
  } catch (error) {
    console.error("[submitReviewAction] Error:", error);
    return { success: false, error: "Erreur lors de la soumission de l'avis" };
  }
}
