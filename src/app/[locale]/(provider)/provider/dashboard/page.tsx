import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";

import { KycBanner } from "@/components/shared/KycBanner";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ locale: string }>;
}

// Placeholder — sera remplace par l'implementation complete en Phase 4 (Profil & Services)
export default async function ProviderDashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations("navigation");
  const tPlaceholder = await getTranslations("placeholder");

  // Fetch provider record with trust badges
  const provider = session?.user?.id
    ? await prisma.provider.findUnique({
        where: { userId: session.user.id },
        include: {
          trustBadges: {
            where: { isActive: true },
          },
        },
      })
    : null;

  const kycStatus = provider?.kycStatus ?? "NOT_SUBMITTED";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* KYC Banner — contextual based on verification status */}
      <KycBanner kycStatus={kycStatus} locale={locale} />

      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
      <p className="mt-4 text-muted-foreground">
        {tPlaceholder("providerDashboardDescription")}
      </p>

      {/* Trust badges — shows current badge status */}
      {provider && (
        <div className="mt-6">
          <TrustBadges
            badges={provider.trustBadges}
            kycStatus={kycStatus}
            size="md"
          />
        </div>
      )}
    </div>
  );
}
