import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getKycSubmissions } from "@/features/kyc/actions/review-kyc";
import { KycSubmissionList } from "@/features/kyc/components/KycSubmissionList";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "KYC Review | Admin",
  };
}

export default async function AdminKycPage() {
  const t = await getTranslations("kyc");
  const result = await getKycSubmissions();

  const submissions = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("adminReviewTitle")}</h1>
        {submissions.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {t("adminPendingCount", { count: submissions.length })}
          </Badge>
        )}
      </div>

      {/* Error state */}
      {!result.success && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {/* Submissions list */}
      <KycSubmissionList submissions={submissions} />
    </div>
  );
}
