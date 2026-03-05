"use client";

import { useRef, useState } from "react";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { AdminReportDetail, AdminReportListItem } from "../actions/admin-queries";
import { ReportActionsDropdown } from "./ReportActionsDropdown";
import { ReportDetailSheet } from "./ReportDetailSheet";
import { SlaBadge } from "./SlaBadge";

interface ReportsDataTableProps {
  reports: AdminReportListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  getReportDetail: (reportId: string) => Promise<AdminReportDetail | null>;
}

function getPriorityDotClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-500";
    case "IMPORTANT":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "OPEN":
      return "border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "INVESTIGATING":
      return "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "RESOLVED":
      return "border-green-500 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "DISMISSED":
      return "border-gray-400 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "";
  }
}

function isSlaExpired(slaDeadline: Date | null): boolean {
  if (!slaDeadline) return false;
  return new Date(slaDeadline).getTime() < Date.now();
}

export function ReportsDataTable({
  reports,
  total,
  currentPage,
  pageSize,
  getReportDetail,
}: ReportsDataTableProps) {
  const t = useTranslations("admin.reports");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedReport, setSelectedReport] = useState<AdminReportDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  function updateUrl(params: Record<string, string | undefined>) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    }
    // Reset to page 1 when filters change (unless explicitly setting page)
    if (!("page" in params)) {
      current.set("page", "1");
    }
    router.push(`?${current.toString()}`);
  }

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrl({ search: value || undefined });
    }, 300);
  }

  async function handleViewDetail(reportId: string) {
    try {
      const detail = await getReportDetail(reportId);
      setSelectedReport(detail);
      setSheetOpen(true);
    } finally {
      // loading state removed (value was never consumed)
    }
  }

  function handleCloseSheet() {
    setSheetOpen(false);
    setSelectedReport(null);
  }

  const priorityLabels: Record<string, string> = {
    CRITICAL: t("critical"),
    IMPORTANT: t("important"),
    MINOR: t("minor"),
  };

  const statusLabels: Record<string, string> = {
    OPEN: t("open"),
    INVESTIGATING: t("investigating"),
    RESOLVED: t("resolved"),
    DISMISSED: t("dismissed"),
  };

  const typeLabels: Record<string, string> = {
    USER: t("typeUser"),
    SERVICE: t("typeService"),
    REVIEW: t("typeReview"),
    MESSAGE: t("typeMessage"),
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          ref={searchInputRef}
          placeholder={t("searchPlaceholder")}
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          <Select
            defaultValue={searchParams.get("priority") ?? "all"}
            onValueChange={(v) => updateUrl({ priority: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("allPriorities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allPriorities")}</SelectItem>
              <SelectItem value="CRITICAL">{t("critical")}</SelectItem>
              <SelectItem value="IMPORTANT">{t("important")}</SelectItem>
              <SelectItem value="MINOR">{t("minor")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get("status") ?? "all"}
            onValueChange={(v) => updateUrl({ status: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="OPEN">{t("open")}</SelectItem>
              <SelectItem value="INVESTIGATING">{t("investigating")}</SelectItem>
              <SelectItem value="RESOLVED">{t("resolved")}</SelectItem>
              <SelectItem value="DISMISSED">{t("dismissed")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get("type") ?? "all"}
            onValueChange={(v) => updateUrl({ type: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              <SelectItem value="USER">{t("typeUser")}</SelectItem>
              <SelectItem value="SERVICE">{t("typeService")}</SelectItem>
              <SelectItem value="REVIEW">{t("typeReview")}</SelectItem>
              <SelectItem value="MESSAGE">{t("typeMessage")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground sm:ml-auto">
          {total} signalement{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("priority")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("reporter")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("type")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead className="w-[140px]">SLA</TableHead>
              <TableHead className="w-[130px]">{t("status")}</TableHead>
              <TableHead className="w-[60px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aucun signalement trouve
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const expired = isSlaExpired(report.slaDeadline) &&
                  report.status !== "RESOLVED" &&
                  report.status !== "DISMISSED";
                const isCritical = report.priority === "CRITICAL" &&
                  (report.status === "OPEN" || report.status === "INVESTIGATING");

                return (
                  <TableRow
                    key={report.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isCritical && "bg-red-50 dark:bg-red-950/20",
                      expired && "border-l-2 border-l-destructive",
                    )}
                    onClick={() => handleViewDetail(report.id)}
                  >
                    {/* Priority column */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            getPriorityDotClass(report.priority),
                          )}
                        />
                        <span className="text-xs font-medium">
                          {priorityLabels[report.priority] ?? report.priority}
                        </span>
                      </div>
                    </TableCell>

                    {/* Reporter */}
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{report.reporterName ?? "N/A"}</span>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[report.type] ?? report.type}
                      </Badge>
                    </TableCell>

                    {/* Reason */}
                    <TableCell>
                      <span className="text-sm line-clamp-1 max-w-[200px]">
                        {report.reason.length > 60
                          ? `${report.reason.slice(0, 60)}...`
                          : report.reason}
                      </span>
                      {report.type === "REVIEW" && report.description?.startsWith("Auto-signalement IA:") && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {report.reason.split(", ").map((r, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-orange-300 bg-orange-50 text-[10px] text-orange-700 dark:border-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                            >
                              IA: {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    {/* SLA */}
                    <TableCell>
                      <SlaBadge
                        slaDeadline={report.slaDeadline}
                        status={report.status}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusBadgeClass(report.status))}
                      >
                        {statusLabels[report.status] ?? report.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <ReportActionsDropdown
                        reportId={report.id}
                        status={report.status}
                        onViewDetail={() => handleViewDetail(report.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateUrl({ page: String(currentPage - 1) })}
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateUrl({ page: String(currentPage + 1) })}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      <ReportDetailSheet
        report={selectedReport}
        open={sheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
