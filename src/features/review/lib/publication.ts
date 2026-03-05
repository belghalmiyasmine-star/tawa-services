import { prisma } from "@/lib/prisma";
import { regenerateProviderSummary } from "@/lib/ai/review-summary";

// ============================================================
// PUBLICATION LOGIC — Double-blind review system
// ============================================================
//
// Core invariant: a review is only visible after BOTH parties
// have submitted their evaluation.  Solo reviews become visible
// automatically after the 10-day submission window expires.
// ============================================================

const REVIEW_WINDOW_DAYS = 10;

// ============================================================
// RATING HELPER (internal — called after every publish event)
// ============================================================

/**
 * Recomputes the average rating for a provider and persists it.
 * Called after both-party publish and after solo-review publication.
 * Exported so review-actions.ts can also call it directly if needed.
 */
export async function updateProviderRating(providerId: string): Promise<void> {
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
      rating: Math.round(averageRating * 10) / 10,
      ratingCount: reviews.length,
    },
  });
}

// ============================================================
// WINDOW HELPERS
// ============================================================

/**
 * Pure function — determines whether the review window is still open
 * for a booking.  Reusable across server actions and UI components.
 */
export function isReviewWindowOpen(booking: {
  completedAt: Date | null;
  status: string;
}): { open: boolean; daysRemaining: number } {
  if (!booking.completedAt || booking.status !== "COMPLETED") {
    return { open: false, daysRemaining: 0 };
  }

  const deadline = new Date(booking.completedAt);
  deadline.setDate(deadline.getDate() + REVIEW_WINDOW_DAYS);
  const now = new Date();

  if (now > deadline) {
    return { open: false, daysRemaining: 0 };
  }

  const msRemaining = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return { open: true, daysRemaining };
}

// ============================================================
// DUAL PUBLICATION (both parties submitted)
// ============================================================

/**
 * Publishes both reviews for a booking simultaneously.
 * Called when the second review is submitted — ensures neither
 * party can read the other's review before submitting their own.
 *
 * If exactly 2 reviews exist (CLIENT + PROVIDER), both are set
 * to published=true and the provider rating is recomputed.
 * If only 1 review exists, nothing happens (wait for second).
 */
export async function publishBothReviews(bookingId: string): Promise<void> {
  // Count non-deleted reviews for this booking
  const reviews = await prisma.review.findMany({
    where: { bookingId, isDeleted: false },
    select: { authorRole: true },
  });

  const hasClient = reviews.some((r) => r.authorRole === "CLIENT");
  const hasProvider = reviews.some((r) => r.authorRole === "PROVIDER");

  // Only publish when BOTH parties have submitted
  if (!hasClient || !hasProvider) return;

  const now = new Date();

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

  // Retrieve providerId from the booking to recompute rating
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { providerId: true },
  });

  if (booking?.providerId) {
    await updateProviderRating(booking.providerId);
    // Regenerate AI review summary (non-blocking)
    void regenerateProviderSummary(booking.providerId);
  }
}

// ============================================================
// SOLO PUBLICATION (window expired with 1 review)
// ============================================================

/**
 * Publishes a solo review after the 10-day window expires.
 * Called by the cron job for each booking where only one party
 * submitted a review and the window has elapsed.
 */
export async function publishSoloReviewIfExpired(
  bookingId: string,
): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      providerId: true,
      completedAt: true,
      status: true,
    },
  });

  if (!booking?.completedAt || booking.status !== "COMPLETED") return false;

  const { open } = isReviewWindowOpen({
    completedAt: booking.completedAt,
    status: booking.status,
  });

  // Window must be closed before we publish solo reviews
  if (open) return false;

  const unpublishedReviews = await prisma.review.findMany({
    where: { bookingId, published: false, isDeleted: false },
    select: { id: true, targetId: true, authorRole: true },
  });

  if (unpublishedReviews.length === 0) return false;

  const now = new Date();

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

  // Recompute provider rating if the unpublished review targets the provider
  const providerId = booking.providerId;
  const targetsProvider = unpublishedReviews.some(
    (r) => r.authorRole === "CLIENT",
  );
  if (providerId && targetsProvider) {
    await updateProviderRating(providerId);
    // Regenerate AI review summary (non-blocking)
    void regenerateProviderSummary(providerId);
  }

  return true;
}

// ============================================================
// BATCH EXPIRATION (called by cron)
// ============================================================

/**
 * Finds COMPLETED bookings whose 10-day review window expired
 * between 10 and 11 days ago and publishes any remaining solo reviews.
 *
 * The [10, 11] day window ensures the cron only processes each
 * booking once (daily schedule — running at 2 AM).
 */
export async function checkAndCloseExpiredWindows(): Promise<{
  processed: number;
  published: number;
}> {
  const now = new Date();

  // Lower bound: window expired > 10 days ago
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - REVIEW_WINDOW_DAYS);

  // Upper bound: window expired < 11 days ago (avoid re-processing old bookings)
  const elevenDaysAgo = new Date(now);
  elevenDaysAgo.setDate(elevenDaysAgo.getDate() - (REVIEW_WINDOW_DAYS + 1));

  // Find bookings in the expiration window that still have unpublished reviews
  const candidateBookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      completedAt: {
        gte: elevenDaysAgo,
        lte: tenDaysAgo,
      },
      isDeleted: false,
      reviews: {
        some: {
          published: false,
          isDeleted: false,
        },
      },
    },
    select: { id: true },
  });

  let published = 0;

  for (const booking of candidateBookings) {
    const wasPublished = await publishSoloReviewIfExpired(booking.id);
    if (wasPublished) published++;
  }

  return {
    processed: candidateBookings.length,
    published,
  };
}
