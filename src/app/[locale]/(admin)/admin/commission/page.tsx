import type { Metadata } from "next";
import { Banknote } from "lucide-react";

import {
  getCommissionOverviewAction,
  getProviderPayoutsAction,
} from "@/features/admin/actions/commission-queries";
import { CommissionOverviewComponent } from "@/features/admin/components/CommissionOverview";
import { ProviderPayoutsTable } from "@/features/admin/components/ProviderPayoutsTable";

export const metadata: Metadata = {
  title: "Commissions | Admin",
};

export default async function AdminCommissionPage() {
  const [overviewResult, payoutsResult] = await Promise.all([
    getCommissionOverviewAction(),
    getProviderPayoutsAction(1, 20),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Banknote className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Commissions et paiements</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble des commissions (12%) et versements prestataires
          </p>
        </div>
      </div>

      {/* Commission Overview */}
      {overviewResult.success ? (
        <CommissionOverviewComponent overview={overviewResult.data} />
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Impossible de charger les donnees de commission.
          </p>
        </div>
      )}

      {/* Provider Payouts Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Versements par prestataire</h2>
        {payoutsResult.success ? (
          <ProviderPayoutsTable
            providers={payoutsResult.data.items}
            total={payoutsResult.data.total}
            currentPage={payoutsResult.data.page}
            pageSize={payoutsResult.data.pageSize}
          />
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <p className="text-muted-foreground">
              Impossible de charger les donnees de versements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
