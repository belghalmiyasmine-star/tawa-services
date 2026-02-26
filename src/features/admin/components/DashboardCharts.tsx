"use client";

import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

// ============================================================
// CHART PLACEHOLDER COMPONENT
// Note: Recharts will be installed and wired in Plan 10-06 (analytics dashboard).
// This component renders placeholder cards linking to /admin/analytics.
// ============================================================

export function DashboardCharts() {
  const t = useTranslations("admin.dashboard");

  const charts = [
    { key: "revenueChart", label: t("revenueChart") },
    { key: "bookingsChart", label: t("bookingsChart") },
    { key: "categoriesChart", label: t("categoriesChart") },
    { key: "userGrowthChart", label: t("userGrowthChart") },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {charts.map((chart) => (
        <Link key={chart.key} href="/admin/analytics" className="block">
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {chart.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Graphiques disponibles dans Analytique
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
