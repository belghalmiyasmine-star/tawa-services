import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

// Placeholder — sera remplace par l'implementation complete en Phase 10 (Admin)
export default async function AdminDashboardPage() {
  const t = await getTranslations("navigation");
  const tPlaceholder = await getTranslations("placeholder");

  // Real-time KYC pending count
  const kycPendingCount = await prisma.provider.count({
    where: { kycStatus: "PENDING" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("admin")}</h1>
      <p className="mt-4 text-muted-foreground">{tPlaceholder("adminDescription")}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Users KPI */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">{t("users")}</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>

        {/* KYC KPI — shows real pending count, clickable link to /admin/kyc */}
        <Link href="/admin/kyc" className="block">
          <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{t("kyc")}</p>
              {/* Amber dot indicator when there are pending verifications */}
              {kycPendingCount > 0 && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-label="Verifications en attente" />
              )}
            </div>
            <p className="mt-1 text-2xl font-bold">{kycPendingCount}</p>
          </div>
        </Link>

        {/* Services KPI */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">{t("services")}</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>

        {/* Reports KPI */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">{t("reports")}</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
