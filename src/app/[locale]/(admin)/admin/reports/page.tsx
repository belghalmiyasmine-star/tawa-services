import type { Metadata } from "next";

import { Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getAdminReportsAction,
  getReportDetailAction,
} from "@/features/admin/actions/admin-queries";
import { ReportsDataTable } from "@/features/admin/components/ReportsDataTable";

export const metadata: Metadata = {
  title: "Signalements | Admin",
};

interface SearchParams {
  search?: string;
  priority?: string;
  status?: string;
  type?: string;
  page?: string;
}

interface AdminReportsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 20;

  const reportsResult = await getAdminReportsAction({
    search: params.search,
    priority: params.priority as "CRITICAL" | "IMPORTANT" | "MINOR" | undefined,
    status: params.status as
      | "OPEN"
      | "INVESTIGATING"
      | "RESOLVED"
      | "DISMISSED"
      | undefined,
    type: params.type as "USER" | "SERVICE" | "REVIEW" | "MESSAGE" | undefined,
    page,
    pageSize,
  });

  const reports = reportsResult.success ? reportsResult.data.items : [];
  const total = reportsResult.success ? reportsResult.data.total : 0;

  // Count CRITICAL open reports for the header badge
  const criticalOpenCount = reports.filter(
    (r) => r.priority === "CRITICAL" && r.status === "OPEN",
  ).length;

  async function handleGetReportDetail(reportId: string) {
    "use server";
    const result = await getReportDetailAction(reportId);
    return result.success ? result.data : null;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Flag className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Signalements</h1>
        {total > 0 && (
          <Badge
            variant={criticalOpenCount > 0 ? "destructive" : "secondary"}
            className="ml-1"
          >
            {total}
          </Badge>
        )}
      </div>

      {reportsResult.success ? (
        <ReportsDataTable
          reports={reports}
          total={total}
          currentPage={page}
          pageSize={pageSize}
          getReportDetail={handleGetReportDetail}
        />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Erreur lors du chargement des signalements
          </p>
        </div>
      )}
    </div>
  );
}
