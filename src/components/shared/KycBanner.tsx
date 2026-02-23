import { Hourglass, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

// ============================================================
// TYPES
// ============================================================

interface KycBannerProps {
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  locale: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * KycBanner — server component banner shown on provider dashboard.
 *
 * - APPROVED: returns null (no banner shown)
 * - NOT_SUBMITTED: amber banner with link to start KYC
 * - REJECTED: amber banner with rejection note + resubmit link
 * - PENDING: blue banner showing verification is in progress
 */
export async function KycBanner({ kycStatus }: KycBannerProps) {
  const t = await getTranslations("kyc");

  // No banner needed when already approved
  if (kycStatus === "APPROVED") {
    return null;
  }

  if (kycStatus === "PENDING") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t("statusPending")}
          </p>
          <Link
            href="/provider/kyc"
            className="shrink-0 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
          >
            {t("adminReviewTitle")}
          </Link>
        </div>
      </div>
    );
  }

  // NOT_SUBMITTED or REJECTED
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t("bannerMessage")}
          </p>
          {kycStatus === "REJECTED" && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {t("statusRejected")} — {t("resubmitButton")}
            </p>
          )}
        </div>
        <Link
          href="/provider/kyc"
          className="shrink-0 text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          {t("bannerAction")}
        </Link>
      </div>
    </div>
  );
}
