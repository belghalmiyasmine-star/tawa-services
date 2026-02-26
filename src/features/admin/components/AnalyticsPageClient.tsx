"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Download, FileText } from "lucide-react";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DateRangePicker } from "./DateRangePicker";
import { AnalyticsKpiCards } from "./AnalyticsKpiCards";
import { RevenueLineChart } from "./RevenueLineChart";
import { BookingsBarChart } from "./BookingsBarChart";
import { CategoriesPieChart } from "./CategoriesPieChart";
import { UserGrowthAreaChart } from "./UserGrowthAreaChart";

import type { AnalyticsData, GeographicBreakdownItem, TopCategoryItem } from "../actions/analytics-queries";

// ============================================================
// EMPTY KPIs
// ============================================================

const emptyKpis = {
  activeUsers: 0,
  totalTransactions: 0,
  totalRevenue: 0,
  conversionRate: 0,
  satisfactionRate: 0,
  avgProviderValidationHours: 0,
};

// ============================================================
// TYPES
// ============================================================

interface AnalyticsPageClientProps {
  analyticsData: AnalyticsData | null;
  geoData: GeographicBreakdownItem[];
  topCategories: TopCategoryItem[];
  startDate: string;
  endDate: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function AnalyticsPageClient({
  analyticsData,
  geoData,
  topCategories,
  startDate,
  endDate,
}: AnalyticsPageClientProps) {
  const t = useTranslations("admin.analytics");
  const tNav = useTranslations("navigation");
  const router = useRouter();

  function handleRangeChange(newStart: string, newEnd: string) {
    const url = `/admin/analytics?startDate=${newStart}&endDate=${newEnd}`;
    router.push(url as never);
  }

  const kpis = analyticsData?.kpis ?? emptyKpis;
  const revenueByMonth = analyticsData?.revenueByMonth ?? [];
  const bookingsByMonth = analyticsData?.bookingsByMonth ?? [];
  const userGrowthByMonth = analyticsData?.userGrowthByMonth ?? [];
  const revenueByCategory = analyticsData?.revenueByCategory ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">{tNav("analytics")}</h1>
        </div>

        {/* Export buttons — placeholder for Plan 10-06 */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            {t("exportCsv")}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <FileText className="mr-2 h-4 w-4" />
            {t("exportPdf")}
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t("dateRange")}:
        </span>
        <DateRangePicker
          onRangeChange={handleRangeChange}
          initialPreset="30d"
        />
      </div>

      {/* KPI Cards */}
      <AnalyticsKpiCards kpis={kpis} />

      {/* Charts 2x2 grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueLineChart data={revenueByMonth} />
        <BookingsBarChart data={bookingsByMonth} />
        <CategoriesPieChart data={revenueByCategory} />
        <UserGrowthAreaChart data={userGrowthByMonth} />
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("topCategories")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topCategories.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                Aucune donnee disponible
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Reservations</TableHead>
                    <TableHead className="text-right">Revenus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.map((cat, index) => (
                    <TableRow key={cat.category}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{cat.category}</TableCell>
                      <TableCell className="text-right">{cat.bookings}</TableCell>
                      <TableCell className="text-right">
                        {cat.revenue.toFixed(0)} TND
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Geographic Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("regionBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {geoData.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                Aucune donnee disponible
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Ville / Delegation</TableHead>
                    <TableHead className="text-right">Reservations</TableHead>
                    <TableHead className="text-right">Revenus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoData.map((item, index) => (
                    <TableRow key={item.city}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{item.city}</TableCell>
                      <TableCell className="text-right">{item.bookings}</TableCell>
                      <TableCell className="text-right">
                        {item.revenue.toFixed(0)} TND
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
