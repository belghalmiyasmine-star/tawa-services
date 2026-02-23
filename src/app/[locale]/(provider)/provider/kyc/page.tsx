import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KycPageClient } from "@/features/kyc/components/KycPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kyc");
  return {
    title: `${t("pageTitle")} | Tawa Services`,
    description: t("pageDescription"),
  };
}

export default async function KycPage() {
  const session = await getServerSession(authOptions);

  // Layout handles auth redirect, but safety check
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Find provider record — layout ensures only PROVIDER and ADMIN can access
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      kycStatus: true,
      kycSubmittedAt: true,
      kycApprovedAt: true,
      kycRejectedAt: true,
      kycRejectedReason: true,
    },
  });

  // Safety check — shouldn't happen for PROVIDER role users
  if (!provider) {
    redirect("/");
  }

  const t = await getTranslations("kyc");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <KycPageClient
        providerId={provider.id}
        initialStatus={provider.kycStatus}
        submittedAt={provider.kycSubmittedAt}
        approvedAt={provider.kycApprovedAt}
        rejectedAt={provider.kycRejectedAt}
        rejectedReason={provider.kycRejectedReason}
      />
    </div>
  );
}
