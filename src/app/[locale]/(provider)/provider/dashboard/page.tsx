import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { UserPen, Briefcase } from "lucide-react";

import { KycBanner } from "@/components/shared/KycBanner";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProviderDashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations("navigation");
  const tProvider = await getTranslations("provider");

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

  const quickLinks = [
    { href: "/provider/profile/edit", icon: UserPen, label: tProvider("editProfile"), description: tProvider("profileSection") },
    { href: "/provider/services", icon: Briefcase, label: t("myServices"), description: tProvider("manageServices") },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* KYC Banner — contextual based on verification status */}
      <KycBanner kycStatus={kycStatus} locale={locale} />

      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>

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

      {/* Quick links grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href as never}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
