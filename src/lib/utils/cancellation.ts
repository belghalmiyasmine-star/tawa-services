// ============================================================
// CANCELLATION POLICY UTILITY
// ============================================================
//
// Pure function with zero side effects.
// Implements the tiered refund policy per 06-CONTEXT.md:
//   > 48h before: FULL refund (100%)
//   24-48h before: PARTIAL refund (50%)
//   < 24h before: NO refund (0%)
//
// Accept optional `now` parameter for testability.
// ============================================================

export type CancellationTier = "FULL" | "PARTIAL" | "NONE";

export interface CancellationResult {
  tier: CancellationTier;
  refundPercentage: number; // 0, 50, or 100
  hoursUntilScheduled: number;
}

/**
 * Calculate refund percentage based on time until the scheduled service date.
 *
 * @param scheduledAt - The date/time the service is scheduled to occur
 * @param now         - Current date/time (defaults to new Date() — override for tests)
 * @returns CancellationResult with tier, refundPercentage, and hoursUntilScheduled
 */
export function calculateRefundPercentage(
  scheduledAt: Date,
  now?: Date,
): CancellationResult {
  const currentTime = now ?? new Date();
  const diffMs = scheduledAt.getTime() - currentTime.getTime();
  const hoursUntilScheduled = diffMs / (1000 * 60 * 60);

  // Service already in the past or less than 24h away
  if (hoursUntilScheduled < 24) {
    return {
      tier: "NONE",
      refundPercentage: 0,
      hoursUntilScheduled,
    };
  }

  // 24h to 48h window — partial refund
  if (hoursUntilScheduled < 48) {
    return {
      tier: "PARTIAL",
      refundPercentage: 50,
      hoursUntilScheduled,
    };
  }

  // More than 48h before — full refund
  return {
    tier: "FULL",
    refundPercentage: 100,
    hoursUntilScheduled,
  };
}
