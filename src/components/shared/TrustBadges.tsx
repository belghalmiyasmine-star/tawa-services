"use client";

import { Award, BadgeCheck, Shield, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

export interface TrustBadgesProps {
  /** Array of trust badges from TrustBadge model */
  badges: { badgeType: string; isActive: boolean }[];
  /** KYC status from Provider.kycStatus */
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  /** Size variant: sm for cards, md for profile page */
  size?: "sm" | "md";
}

// Badge type constants
const BADGE_TYPES = {
  IDENTITY_VERIFIED: "IDENTITY_VERIFIED",
  QUICK_RESPONSE: "QUICK_RESPONSE",
  TOP_PROVIDER: "TOP_PROVIDER",
} as const;

// ============================================================
// COMPONENT
// ============================================================

/**
 * TrustBadges — displays trust badges for a provider.
 *
 * - If kycStatus !== "APPROVED": shows gray "Non verifie" badge
 * - If kycStatus === "APPROVED": renders each active badge with icon + tooltip
 *   - IDENTITY_VERIFIED: blue BadgeCheck icon
 *   - QUICK_RESPONSE: green Zap icon
 *   - TOP_PROVIDER: gold/amber Award icon
 */
export function TrustBadges({
  badges,
  kycStatus,
  size = "sm",
}: TrustBadgesProps) {
  const t = useTranslations("kyc");

  const sizeClasses =
    size === "md"
      ? "text-sm px-3 py-1 gap-1.5"
      : "text-xs px-2 py-0.5 gap-1";

  // Non-verified: show gray badge
  if (kycStatus !== "APPROVED") {
    return (
      <div className="flex flex-row flex-wrap items-center gap-1.5">
        <span
          title={t("badgeNonVerified")}
          className="inline-block"
        >
          <Badge
            variant="outline"
            className={cn(
              "inline-flex cursor-default items-center border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
              sizeClasses,
            )}
          >
            <Shield
              className={cn("shrink-0", size === "md" ? "h-4 w-4" : "h-3 w-3")}
            />
            <span>{t("badgeNonVerified")}</span>
          </Badge>
        </span>
      </div>
    );
  }

  // Approved: render active badges
  const activeBadges = badges.filter((b) => b.isActive);

  if (activeBadges.length === 0) {
    // Approved but no badges yet — still show Non verifie? No: show nothing.
    // Per spec, only show the gray badge when not approved.
    // When approved with no badges, show nothing (rare edge case).
    return null;
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-1.5">
      {activeBadges.map((badge) => {
        if (badge.badgeType === BADGE_TYPES.IDENTITY_VERIFIED) {
          return (
            <span
              key={badge.badgeType}
              title={t("badgeTooltip")}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex cursor-default items-center border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                  sizeClasses,
                )}
              >
                <BadgeCheck
                  className={cn(
                    "shrink-0",
                    size === "md" ? "h-4 w-4" : "h-3 w-3",
                  )}
                />
                <span>{t("badgeIdentityVerified")}</span>
              </Badge>
            </span>
          );
        }

        if (badge.badgeType === BADGE_TYPES.QUICK_RESPONSE) {
          return (
            <span
              key={badge.badgeType}
              title={t("badgeTooltipQuickResponse")}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex cursor-default items-center border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400",
                  sizeClasses,
                )}
              >
                <Zap
                  className={cn(
                    "shrink-0",
                    size === "md" ? "h-4 w-4" : "h-3 w-3",
                  )}
                />
                <span>{t("badgeQuickResponse")}</span>
              </Badge>
            </span>
          );
        }

        if (badge.badgeType === BADGE_TYPES.TOP_PROVIDER) {
          return (
            <span
              key={badge.badgeType}
              title={t("badgeTooltipTopProvider")}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex cursor-default items-center border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                  sizeClasses,
                )}
              >
                <Award
                  className={cn(
                    "shrink-0",
                    size === "md" ? "h-4 w-4" : "h-3 w-3",
                  )}
                />
                <span>{t("badgeTopProvider")}</span>
              </Badge>
            </span>
          );
        }

        // Unknown badge type — skip
        return null;
      })}
    </div>
  );
}
