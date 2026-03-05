// ============================================================
// SMART PROVIDER RECOMMENDATIONS
// ============================================================
// Scoring algorithm — no API calls needed

import { prisma } from "@/lib/prisma";

interface ScoredProvider {
  providerId: string;
  score: number;
}

/**
 * Get recommended provider IDs for a client based on scoring algorithm.
 *
 * Scoring:
 * - Same category as past bookings: +30
 * - Same city/delegation as client: +25
 * - KYC verified: +20
 * - Rating >= 4.5: +15, >= 4.0: +10
 * - More than 10 completed missions: +10
 * - Has reviews with text: +5
 */
export async function getRecommendations(
  clientId: string,
  limit: number = 6,
): Promise<string[]> {
  try {
    // 1. Get client's past booking categories and location
    const [clientBookings, clientUser] = await Promise.all([
      prisma.booking.findMany({
        where: {
          clientId,
          isDeleted: false,
          status: { in: ["COMPLETED", "ACCEPTED", "IN_PROGRESS"] },
        },
        select: {
          service: {
            select: { categoryId: true },
          },
          providerId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.user.findUnique({
        where: { id: clientId },
        select: {
          provider: {
            select: {
              delegations: {
                select: { delegationId: true },
                take: 5,
              },
            },
          },
        },
      }),
    ]);

    // Extract category IDs the client has booked before
    const bookedCategoryIds = new Set(
      clientBookings.map((b) => b.service.categoryId),
    );

    // Extract provider IDs the client already booked (to deprioritize)
    const alreadyBookedProviderIds = new Set(
      clientBookings.map((b) => b.providerId),
    );

    // Get client's delegation IDs (if they're also a provider with location)
    // For clients without provider profiles, we'll get location from their bookings
    const clientDelegationIds = new Set<string>();
    if (clientUser?.provider?.delegations) {
      for (const d of clientUser.provider.delegations) {
        clientDelegationIds.add(d.delegationId);
      }
    }

    // If client has no provider profile, infer location from booked providers
    if (clientDelegationIds.size === 0 && clientBookings.length > 0) {
      const bookedProviderIds = [...alreadyBookedProviderIds].slice(0, 5);
      const providerDelegations = await prisma.providerDelegation.findMany({
        where: { providerId: { in: bookedProviderIds } },
        select: { delegationId: true },
      });
      for (const pd of providerDelegations) {
        clientDelegationIds.add(pd.delegationId);
      }
    }

    // 2. Fetch active providers with relevant data (pre-filtered, lightweight query)
    const providers = await prisma.provider.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        ratingCount: { gte: 1 },
      },
      select: {
        id: true,
        rating: true,
        ratingCount: true,
        completedMissions: true,
        kycStatus: true,
        services: {
          where: { status: "ACTIVE", isDeleted: false },
          select: { categoryId: true },
          take: 10,
        },
        delegations: {
          select: { delegationId: true },
        },
      },
      orderBy: [{ rating: "desc" }, { completedMissions: "desc" }],
      take: 50,
    });

    // 3. Score each provider
    const scored: ScoredProvider[] = [];

    for (const provider of providers) {
      let score = 0;

      // Same category as past bookings: +30
      const providerCategories = new Set(
        provider.services.map((s) => s.categoryId),
      );
      const hasMatchingCategory = [...bookedCategoryIds].some((catId) =>
        providerCategories.has(catId),
      );
      if (hasMatchingCategory) {
        score += 30;
      }

      // Same city/delegation: +25
      const providerDelegations = new Set(
        provider.delegations.map((d) => d.delegationId),
      );
      const hasMatchingLocation = [...clientDelegationIds].some((delId) =>
        providerDelegations.has(delId),
      );
      if (hasMatchingLocation) {
        score += 25;
      }

      // KYC verified: +20
      if (provider.kycStatus === "APPROVED") {
        score += 20;
      }

      // Rating: +15 for >= 4.5, +10 for >= 4.0
      if (provider.rating >= 4.5) {
        score += 15;
      } else if (provider.rating >= 4.0) {
        score += 10;
      }

      // More than 10 completed missions: +10
      if (provider.completedMissions > 10) {
        score += 10;
      }

      // Slight penalty for already-booked providers (variety)
      if (alreadyBookedProviderIds.has(provider.id)) {
        score -= 5;
      }

      scored.push({ providerId: provider.id, score });
    }

    // 4. Sort by score descending, return top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.providerId);
  } catch (error) {
    console.error("[getRecommendations] Error:", error);
    return [];
  }
}
