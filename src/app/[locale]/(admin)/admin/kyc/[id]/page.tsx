import type { Metadata } from "next";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

import { getKycSubmissionDetail } from "@/features/kyc/actions/review-kyc";
import { KycReviewDetail } from "@/features/kyc/components/KycReviewDetail";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface AdminKycDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminKycDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getKycSubmissionDetail(id);

  const name = result.success ? result.data.displayName : "Prestataire";

  return {
    title: `KYC — ${name} | Admin`,
  };
}

export default async function AdminKycDetailPage({
  params,
}: AdminKycDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const result = await getKycSubmissionDetail(id);

  // If not found or error, redirect to list
  if (!result.success) {
    return redirect({ href: "/admin/kyc", locale });
  }

  const detail = result.data;

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/kyc">← Retour</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Dossier KYC — {detail.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">{detail.email}</p>
        </div>
      </div>

      {/* Review detail component */}
      <KycReviewDetail detail={detail} />
    </div>
  );
}
