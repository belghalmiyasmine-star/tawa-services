"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import type { Review } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface ReviewWithAuthor {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string;
  authorRole: string;
  stars: number;
  qualityRating: number | null;
  punctualityRating: number | null;
  communicationRating: number | null;
  cleanlinessRating: number | null;
  text: string | null;
  photoUrls: string[];
  published: boolean;
  publishedAt: Date | null;
  flagged: boolean;
  createdAt: Date;
  author: {
    firstName: string | null;
  };
}

export interface CriteriaAverages {
  stars: number;
  quality: number;
  punctuality: number;
  communication: number;
  cleanliness: number;
}

export interface ProviderReviewsResult {
  reviews: ReviewWithAuthor[];
  total: number;
  averages: CriteriaAverages;
}

export interface ReviewWindowStatus {
  canReview: boolean;
  hasReviewed: boolean;
  daysRemaining: number;
  otherPartyReviewed: boolean;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Extracts first name from a full name string (stored as "firstName lastName").
 */
function extractFirstName(fullName: string | null): string | null {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  return parts[0] ?? null;
}

// ============================================================
// QUERY ACTIONS
// ============================================================

/**
 * Returns reviews for a specific booking.
 * - Published reviews are visible to everyone involved.
 * - Authors can see their own unpublished review.
 */
export async function getBookingReviewsAction(
  bookingId: string,
): Promise<ActionResult<Review[]>> {
  try {
    if (!bookingId) {
      return { success: false, error: "L'identifiant de réservation est requis" };
    }

    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const reviews = await prisma.review.findMany({
      where: {
        bookingId,
        isDeleted: false,
        // Return published reviews OR the current user's own review
        OR: [
          { published: true },
          ...(currentUserId ? [{ authorId: currentUserId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("[getBookingReviewsAction] Error:", error);
    return { success: false, error: "Erreur lors de la récupération des avis" };
  }
}

/**
 * Returns published, non-flagged reviews for a provider.
 * Supports pagination and sorting.
 * Includes author's first name (privacy-preserving — last name not included).
 * Computes averages for all criteria.
 */
export async function getProviderReviewsAction(
  providerId: string,
  opts?: {
    page?: number;
    limit?: number;
    sort?: "recent" | "best" | "worst";
  },
): Promise<ActionResult<ProviderReviewsResult>> {
  try {
    if (!providerId) {
      return { success: false, error: "L'identifiant du prestataire est requis" };
    }

    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(50, Math.max(1, opts?.limit ?? 10));
    const sort = opts?.sort ?? "recent";
    const skip = (page - 1) * limit;

    // Determine orderBy from sort option
    const orderBy =
      sort === "best"
        ? { stars: "desc" as const }
        : sort === "worst"
          ? { stars: "asc" as const }
          : { publishedAt: "desc" as const };

    // Fetch provider's userId to match targetId
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (!provider) {
      return { success: false, error: "Prestataire introuvable" };
    }

    const whereClause = {
      targetId: provider.userId,
      published: true,
      flagged: false,
      isDeleted: false,
    };

    // Fetch total count + paginated reviews in parallel
    const [total, rawReviews] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          bookingId: true,
          authorId: true,
          targetId: true,
          authorRole: true,
          stars: true,
          qualityRating: true,
          punctualityRating: true,
          communicationRating: true,
          cleanlinessRating: true,
          text: true,
          photoUrls: true,
          published: true,
          publishedAt: true,
          flagged: true,
          createdAt: true,
          // Include author name (first name only for privacy)
          booking: {
            select: {
              client: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    // Map raw reviews to ReviewWithAuthor shape
    const reviews: ReviewWithAuthor[] = rawReviews.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      authorId: r.authorId,
      targetId: r.targetId,
      authorRole: r.authorRole,
      stars: r.stars,
      qualityRating: r.qualityRating,
      punctualityRating: r.punctualityRating,
      communicationRating: r.communicationRating,
      cleanlinessRating: r.cleanlinessRating,
      text: r.text,
      photoUrls: r.photoUrls,
      published: r.published,
      publishedAt: r.publishedAt,
      flagged: r.flagged,
      createdAt: r.createdAt,
      author: {
        firstName: extractFirstName(r.booking.client.name),
      },
    }));

    // Compute aggregates from ALL published reviews (not just current page)
    const allReviews = await prisma.review.findMany({
      where: whereClause,
      select: {
        stars: true,
        qualityRating: true,
        punctualityRating: true,
        communicationRating: true,
        cleanlinessRating: true,
      },
    });

    const computeAvg = (values: (number | null)[]): number => {
      const validValues = values.filter((v): v is number => v !== null);
      if (validValues.length === 0) return 0;
      return Math.round((validValues.reduce((a, b) => a + b, 0) / validValues.length) * 10) / 10;
    };

    const averages: CriteriaAverages = {
      stars: computeAvg(allReviews.map((r) => r.stars)),
      quality: computeAvg(allReviews.map((r) => r.qualityRating)),
      punctuality: computeAvg(allReviews.map((r) => r.punctualityRating)),
      communication: computeAvg(allReviews.map((r) => r.communicationRating)),
      cleanliness: computeAvg(allReviews.map((r) => r.cleanlinessRating)),
    };

    return {
      success: true,
      data: { reviews, total, averages },
    };
  } catch (error) {
    console.error("[getProviderReviewsAction] Error:", error);
    return { success: false, error: "Erreur lors de la récupération des avis" };
  }
}

/**
 * Returns the review window status for the current user and a specific booking.
 * Used by the UI to show/hide the review form.
 */
export async function getReviewWindowAction(
  bookingId: string,
): Promise<ActionResult<ReviewWindowStatus>> {
  try {
    if (!bookingId) {
      return { success: false, error: "L'identifiant de réservation est requis" };
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const currentUserId = session.user.id;

    // Fetch booking details
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, isDeleted: false },
      select: {
        id: true,
        clientId: true,
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

    // Booking must be COMPLETED for review window to apply
    if (booking.status !== "COMPLETED" || !booking.completedAt) {
      return {
        success: true,
        data: {
          canReview: false,
          hasReviewed: false,
          daysRemaining: 0,
          otherPartyReviewed: false,
        },
      };
    }

    // Calculate days remaining in 10-day window
    const now = new Date();
    const windowDeadline = new Date(booking.completedAt);
    windowDeadline.setDate(windowDeadline.getDate() + 10);
    const msRemaining = windowDeadline.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    // Check if current user is part of this booking
    const isClient = booking.clientId === currentUserId;
    const isProvider = booking.provider.userId === currentUserId;

    if (!isClient && !isProvider) {
      return { success: false, error: "Accès non autorisé" };
    }

    // Check if current user already reviewed
    const myReview = await prisma.review.findFirst({
      where: { bookingId, authorId: currentUserId, isDeleted: false },
    });

    const hasReviewed = myReview !== null;

    // Check if the other party has reviewed
    const otherPartyRole = isClient ? "PROVIDER" : "CLIENT";
    const otherPartyReview = await prisma.review.findFirst({
      where: { bookingId, authorRole: otherPartyRole, isDeleted: false },
    });

    const otherPartyReviewed = otherPartyReview !== null;

    const canReview = !hasReviewed && daysRemaining > 0;

    return {
      success: true,
      data: {
        canReview,
        hasReviewed,
        daysRemaining,
        otherPartyReviewed,
      },
    };
  } catch (error) {
    console.error("[getReviewWindowAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la vérification de la période d'évaluation",
    };
  }
}
