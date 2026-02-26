"use client";

import { useTranslations } from "next-intl";
import { Percent, TrendingUp, ArrowDownCircle, Clock, FileCheck, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommissionOverview } from "../actions/commission-queries";

// ============================================================
// TYPES
// ============================================================

interface CommissionOverviewProps {
  overview: CommissionOverview;
}

// ============================================================
// HELPERS
// ============================================================

function formatTND(amount: number): string {
  return new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " TND";
}

// ============================================================
// COMPONENT
// ============================================================

export function CommissionOverviewComponent({ overview }: CommissionOverviewProps) {
  const t = useTranslations("admin.commission");

  const stats = [
    {
      label: t("commissionRate"),
      value: "12%",
      icon: Percent,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Taux fixe plateforme",
    },
    {
      label: t("totalCommission"),
      value: formatTND(overview.totalCommission),
      icon: TrendingUp,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      description: `Sur ${formatTND(overview.totalRevenue)} de revenus`,
    },
    {
      label: t("totalPayouts"),
      value: formatTND(overview.totalPayouts),
      icon: ArrowDownCircle,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Verses aux prestataires",
    },
    {
      label: t("pendingPayouts"),
      value: formatTND(overview.pendingPayouts),
      icon: Clock,
      iconColor: overview.pendingPayouts > 0 ? "text-amber-600" : "text-gray-600",
      bgColor: overview.pendingPayouts > 0 ? "bg-amber-50" : "bg-gray-50",
      description: overview.pendingPayouts > 0 ? "En attente de liberation" : "Aucun versement en attente",
      highlight: overview.pendingPayouts > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={stat.highlight ? "border-amber-200" : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Withdrawal stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demandes de retrait en attente
            </CardTitle>
            <div className="rounded-full bg-orange-50 p-2">
              <AlertCircle
                className={`h-4 w-4 ${overview.withdrawalsPending > 0 ? "text-orange-600" : "text-gray-400"}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.withdrawalsPending}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {overview.withdrawalsPending === 0
                ? "Aucune demande en attente"
                : `${overview.withdrawalsPending} demande${overview.withdrawalsPending > 1 ? "s" : ""} a traiter`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total verse via retraits
            </CardTitle>
            <div className="rounded-full bg-green-50 p-2">
              <FileCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTND(overview.withdrawalsProcessed)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Retraits traites et payes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
