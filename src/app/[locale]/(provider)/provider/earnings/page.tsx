import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { EarningsDashboard } from "@/features/payment/components/EarningsDashboard";

export const metadata: Metadata = {
  title: "Mes revenus | Tawa Services",
};

export default async function ProviderEarningsPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mes revenus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez vos revenus, commissions et historique de transactions
        </p>
      </div>

      <EarningsDashboard />
    </div>
  );
}
