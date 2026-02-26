"use client";

import {
  Users,
  CreditCard,
  Banknote,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnalyticsKpis } from "../actions/analytics-queries";

// ============================================================
// HELPERS
// ============================================================

function formatRevenue(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K TND`;
  }
  return `${amount.toFixed(0)} TND`;
}

function formatValidationTime(hours: number): string {
  if (hours === 0) return "—";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}j`;
}

// ============================================================
// TYPES
// ============================================================

interface AnalyticsKpiCardsProps {
  kpis: AnalyticsKpis;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  target?: string;
  targetColor?: "green" | "red" | "neutral";
  subValue?: string;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  target,
  targetColor = "neutral",
  subValue,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subValue && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subValue}</p>
            )}
            {target && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  targetColor === "green" && "text-green-600 dark:text-green-400",
                  targetColor === "red" && "text-red-600 dark:text-red-400",
                  targetColor === "neutral" && "text-muted-foreground",
                )}
              >
                {target}
              </p>
            )}
          </div>
          <div className="ml-3 rounded-full bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AnalyticsKpiCards({ kpis }: AnalyticsKpiCardsProps) {
  const t = useTranslations("admin.analytics");

  const conversionTarget = 5; // 5% target
  const validationTarget = 48; // 48h target

  const conversionColor: "green" | "red" =
    kpis.conversionRate >= conversionTarget ? "green" : "red";
  const validationColor: "green" | "red" =
    kpis.avgProviderValidationHours <= validationTarget &&
    kpis.avgProviderValidationHours > 0
      ? "green"
      : kpis.avgProviderValidationHours === 0
        ? "neutral" as unknown as "red"
        : "red";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {/* Active Users */}
      <KpiCard
        icon={<Users className="h-5 w-5" />}
        label={t("activeUsers")}
        value={kpis.activeUsers.toLocaleString("fr-TN")}
      />

      {/* Total Transactions */}
      <KpiCard
        icon={<CreditCard className="h-5 w-5" />}
        label={t("totalTransactions")}
        value={kpis.totalTransactions.toLocaleString("fr-TN")}
      />

      {/* Revenue */}
      <KpiCard
        icon={<Banknote className="h-5 w-5" />}
        label={t("totalRevenue")}
        value={formatRevenue(kpis.totalRevenue)}
      />

      {/* Conversion Rate */}
      <KpiCard
        icon={<TrendingUp className="h-5 w-5" />}
        label={t("conversionRate")}
        value={`${kpis.conversionRate.toFixed(1)}%`}
        target={`${t("target")}: ${conversionTarget}%`}
        targetColor={conversionColor}
      />

      {/* Satisfaction Rate */}
      <KpiCard
        icon={<Star className="h-5 w-5" />}
        label={t("satisfactionRate")}
        value={`${kpis.satisfactionRate.toFixed(1)}%`}
        subValue={`${((kpis.satisfactionRate / 100) * 5).toFixed(1)}/5`}
      />

      {/* Provider Validation Time */}
      <KpiCard
        icon={<Clock className="h-5 w-5" />}
        label={t("providerValidation")}
        value={formatValidationTime(kpis.avgProviderValidationHours)}
        target={`${t("target")}: <48h`}
        targetColor={
          kpis.avgProviderValidationHours === 0
            ? "neutral"
            : kpis.avgProviderValidationHours <= validationTarget
              ? "green"
              : "red"
        }
      />
    </div>
  );
}
