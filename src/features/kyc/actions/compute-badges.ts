"use server";

import { prisma } from "@/lib/prisma";

// ============================================================
// BADGE TYPE CONSTANTS
// ============================================================

const AUTO_BADGE_TYPES = {
  QUICK_RESPONSE: "QUICK_RESPONSE",
  TOP_PROVIDER: "TOP_PROVIDER",
} as const;

// ============================================================
// BADGE COMPUTATION THRESHOLDS
// ============================================================

/** QUICK_RESPONSE: average response time must be strictly less than 1 hour */
const QUICK_RESPONSE_THRESHOLD_HOURS = 1;

/** TOP_PROVIDER: rating must be strictly greater than 4.5 */
const TOP_PROVIDER_MIN_RATING = 4.5;

/** TOP_PROVIDER: completed missions must be strictly greater than 10 */
const TOP_PROVIDER_MIN_MISSIONS = 10;

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Compute and auto-award QUICK_RESPONSE and TOP_PROVIDER badges based on
 * current provider stats.
 *
 * Note: IDENTITY_VERIFIED is handled separately by approveKycAction (Plan 03).
 * This function only manages the two auto-computed badges.
 *
 * Designed to be called after:
 * - Booking completion (Phase 6+)
 * - Rating updates (Phase 8+)
 *
 * Safe to call at any time — uses upsert to avoid duplicate constraint violations.
 * Returns silently if provider is not found (defensive — no error thrown).
 */
export async function computeAndAwardBadges(providerId: string): Promise<void> {
  // Find provider with all stats needed for badge computation
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      kycStatus: true,
      rating: true,
      ratingCount: true,
      completedMissions: true,
      responseTimeHours: true,
    },
  });

  // Defensive: return silently if provider not found
  if (!provider) {
    return;
  }

  // Compute QUICK_RESPONSE eligibility
  // Award if: responseTimeHours is set AND strictly less than 1 hour
  const shouldHaveQuickResponse =
    provider.responseTimeHours !== null &&
    provider.responseTimeHours < QUICK_RESPONSE_THRESHOLD_HOURS;

  // Compute TOP_PROVIDER eligibility
  // Award if: rating > 4.5 AND completedMissions > 10
  const shouldHaveTopProvider =
    provider.rating > TOP_PROVIDER_MIN_RATING &&
    provider.completedMissions > TOP_PROVIDER_MIN_MISSIONS;

  // Upsert QUICK_RESPONSE badge
  await prisma.trustBadge.upsert({
    where: {
      providerId_badgeType: {
        providerId: provider.id,
        badgeType: AUTO_BADGE_TYPES.QUICK_RESPONSE,
      },
    },
    update: {
      isActive: shouldHaveQuickResponse,
    },
    create: {
      providerId: provider.id,
      badgeType: AUTO_BADGE_TYPES.QUICK_RESPONSE,
      isActive: shouldHaveQuickResponse,
    },
  });

  // Upsert TOP_PROVIDER badge
  await prisma.trustBadge.upsert({
    where: {
      providerId_badgeType: {
        providerId: provider.id,
        badgeType: AUTO_BADGE_TYPES.TOP_PROVIDER,
      },
    },
    update: {
      isActive: shouldHaveTopProvider,
    },
    create: {
      providerId: provider.id,
      badgeType: AUTO_BADGE_TYPES.TOP_PROVIDER,
      isActive: shouldHaveTopProvider,
    },
  });
}

/**
 * Get all active badges for a provider.
 *
 * Returns an array of { badgeType, isActive } for active badges only.
 * Intended for use in server components that render provider profiles or cards.
 */
export async function getProviderBadges(
  providerId: string,
): Promise<{ badgeType: string; isActive: boolean }[]> {
  const badges = await prisma.trustBadge.findMany({
    where: {
      providerId,
      isActive: true,
    },
    select: {
      badgeType: true,
      isActive: true,
    },
  });

  return badges;
}
