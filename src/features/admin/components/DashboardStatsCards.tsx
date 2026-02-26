"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  ShieldCheck,
  Calendar,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  Settings,
  Flag,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { AdminStats } from "@/features/admin/actions/admin-queries";

// ============================================================
// HELPERS
// ============================================================

function TrendArrow({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (current > previous) {
    return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  }
  if (current < previous) {
    return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TrendPercent({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const t = useTranslations("admin.dashboard");
  if (previous === 0) return null;

  const pct = Math.round(((current - previous) / previous) * 100);
  const isUp = pct > 0;
  const isDown = pct < 0;

  return (
    <span
      className={
        isUp
          ? "text-xs font-medium text-green-600"
          : isDown
            ? "text-xs font-medium text-red-600"
            : "text-xs font-medium text-muted-foreground"
      }
    >
      {pct > 0 ? "+" : ""}
      {pct}% {t("vsLastMonth")}
    </span>
  );
}

// ============================================================
// PROPS
// ============================================================

type Props = {
  stats: AdminStats;
};

// ============================================================
// COMPONENT
// ============================================================

export function DashboardStatsCards({ stats }: Props) {
  const t = useTranslations("admin.dashboard");

  const formattedRevenue = new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  const formattedCurrentRevenue = new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.currentMonthRevenue);

  return (
    <div className="space-y-4">
      {/* Main KPI Cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalUsers")}
              </p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.totalUsers.toLocaleString("fr-FR")}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendArrow
                current={stats.currentMonthUsers}
                previous={stats.previousMonthUsers}
              />
              <TrendPercent
                current={stats.currentMonthUsers}
                previous={stats.previousMonthUsers}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Providers */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalProviders")}
              </p>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.totalProviders.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalBookings")}
              </p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.totalBookings.toLocaleString("fr-FR")}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendArrow
                current={stats.currentMonthBookings}
                previous={stats.previousMonthBookings}
              />
              <TrendPercent
                current={stats.currentMonthBookings}
                previous={stats.previousMonthBookings}
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalRevenue")}
              </p>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formattedRevenue}</p>
            <div className="mt-1 flex items-center gap-1">
              <TrendArrow
                current={stats.currentMonthRevenue}
                previous={stats.previousMonthRevenue}
              />
              <TrendPercent
                current={stats.currentMonthRevenue}
                previous={stats.previousMonthRevenue}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI Cards — 3 cols */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* KYC Pending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("pendingKyc")}
              </p>
              <div className="flex items-center gap-1.5">
                {stats.pendingKyc > 0 && (
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-amber-500"
                    aria-label="KYC en attente"
                  />
                )}
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.pendingKyc.toLocaleString("fr-FR")}
            </p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("activeServices")}
              </p>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.activeServices.toLocaleString("fr-FR")}
            </p>
          </CardContent>
        </Card>

        {/* Open Reports */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("openReports")}
              </p>
              <div className="flex items-center gap-1.5">
                {stats.openReports > 5 && (
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-red-500"
                    aria-label="Signalements critiques"
                  />
                )}
                <Flag className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {stats.openReports.toLocaleString("fr-FR")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
