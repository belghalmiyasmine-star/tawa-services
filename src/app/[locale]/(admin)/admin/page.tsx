import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Users, Grid2X2, Flag, BarChart3 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminStatsAction } from "@/features/admin/actions/admin-queries";
import { getAdminReportsAction } from "@/features/admin/actions/admin-queries";
import { DashboardStatsCards } from "@/features/admin/components/DashboardStatsCards";
import { DashboardCharts } from "@/features/admin/components/DashboardCharts";

export const metadata: Metadata = {
  title: "Tableau de bord | Admin",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "destructive",
  IMPORTANT: "default",
  MINOR: "secondary",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critique",
  IMPORTANT: "Important",
  MINOR: "Mineur",
};

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const tNav = await getTranslations("navigation");

  const [statsResult, reportsResult] = await Promise.all([
    getAdminStatsAction(),
    getAdminReportsAction({ page: 1, pageSize: 5 }),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const recentReports = reportsResult.success ? reportsResult.data.items : [];

  const quickLinks = [
    {
      href: "/admin/users",
      icon: Users,
      label: tNav("users"),
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      href: "/admin/kyc",
      icon: Grid2X2,
      label: tNav("kyc"),
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      href: "/admin/reports",
      icon: Flag,
      label: tNav("reports"),
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      href: "/admin/analytics",
      icon: BarChart3,
      label: tNav("analytics"),
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
      </div>

      {/* Stats Cards */}
      {stats ? (
        <DashboardStatsCards stats={stats} />
      ) : (
        <div className="rounded-lg border bg-destructive/10 p-4 text-sm text-destructive">
          Impossible de charger les statistiques.
        </div>
      )}

      {/* Charts Placeholder */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">{tNav("analytics")}</h2>
        <DashboardCharts />
      </section>

      {/* Quick Links + Recent Reports — side by side on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Access Links */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Accès rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className={`rounded-full p-3 ${link.bg}`}>
                        <Icon className={`h-6 w-6 ${link.color}`} />
                      </div>
                      <span className="text-sm font-medium">{link.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Reports */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Signalements récents</h2>
            <Link
              href="/admin/reports"
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun signalement en cours
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={"/admin/reports" as never}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-accent/50">
                    <CardContent className="flex items-center gap-3 p-3">
                      <Badge
                        variant={
                          (PRIORITY_COLORS[report.priority] as
                            | "destructive"
                            | "default"
                            | "secondary") ?? "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {PRIORITY_LABELS[report.priority] ?? report.priority}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {report.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.reporterName ?? "Anonyme"} •{" "}
                          {new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(report.createdAt))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
