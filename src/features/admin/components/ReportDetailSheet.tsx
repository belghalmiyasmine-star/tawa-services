"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { updateReportAction } from "../actions/admin-actions";
import type { AdminReportDetail } from "../actions/admin-queries";
import { SlaBadge } from "./SlaBadge";

interface ReportDetailSheetProps {
  report: AdminReportDetail | null;
  open: boolean;
  onClose: () => void;
}

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-red-500 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "IMPORTANT":
      return "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "border-gray-400 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

type StatusStep = "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";

const STATUS_STEPS: StatusStep[] = ["OPEN", "INVESTIGATING", "RESOLVED"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const t = useTranslations("admin.reports");

  const statusLabels: Record<string, string> = {
    OPEN: t("open"),
    INVESTIGATING: t("investigating"),
    RESOLVED: t("resolved"),
    DISMISSED: t("dismissed"),
  };

  if (currentStatus === "DISMISSED") {
    return (
      <div className="flex items-center gap-2">
        {["OPEN", "INVESTIGATING", "DISMISSED"].map((step, idx) => {
          const isActive = step === "DISMISSED";
          const isPassed = idx < 2;
          return (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div
                  className={cn("mx-1 h-px w-8", isPassed ? "bg-primary" : "bg-muted")}
                />
              )}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isActive
                      ? "bg-gray-500 text-white"
                      : isPassed
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background text-muted-foreground",
                  )}
                >
                  {idx + 1}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {statusLabels[step]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(currentStatus as StatusStep);

  return (
    <div className="flex items-center gap-2">
      {STATUS_STEPS.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isPassed = idx < currentIndex;
        return (
          <div key={step} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  "mx-1 h-px w-8",
                  isPassed ? "bg-primary" : "bg-muted",
                )}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : isPassed
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background text-muted-foreground",
                )}
              >
                {idx + 1}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {statusLabels[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportDetailSheet({
  report,
  open,
  onClose,
}: ReportDetailSheetProps) {
  const t = useTranslations("admin.reports");
  const router = useRouter();
  const { toast } = useToast();
  const [adminNote, setAdminNote] = useState(report?.adminNote ?? "");
  const [loading, setLoading] = useState(false);

  // Sync adminNote when report changes
  useEffect(() => {
    setAdminNote(report?.adminNote ?? "");
  }, [report?.id, report?.adminNote]);

  const noteValue = report?.adminNote ?? "";

  async function handleAction(
    newStatus: "INVESTIGATING" | "RESOLVED" | "DISMISSED",
  ) {
    if (!report) return;
    setLoading(true);
    try {
      const result = await updateReportAction({
        reportId: report.id,
        status: newStatus,
        adminNote: adminNote || undefined,
      });
      if (result.success) {
        toast({
          title: t("updated_success"),
        });
        onClose();
        router.refresh();
      } else {
        toast({
          title: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote() {
    if (!report) return;
    setLoading(true);
    try {
      const result = await updateReportAction({
        reportId: report.id,
        status: report.status as "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED",
        adminNote: adminNote || undefined,
      });
      if (result.success) {
        toast({ title: t("updated_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  const typeLabels: Record<string, string> = {
    USER: t("typeUser"),
    SERVICE: t("typeService"),
    REVIEW: t("typeReview"),
    MESSAGE: t("typeMessage"),
  };

  const priorityLabels: Record<string, string> = {
    CRITICAL: t("critical"),
    IMPORTANT: t("important"),
    MINOR: t("minor"),
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {report ? (
          <>
            <SheetHeader className="space-y-3">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[report.type] ?? report.type}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getPriorityBadgeClass(report.priority))}
                >
                  {priorityLabels[report.priority] ?? report.priority}
                </Badge>
                <SlaBadge
                  slaDeadline={report.slaDeadline}
                  status={report.status}
                />
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Status Timeline */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Progression
                </p>
                <StatusTimeline currentStatus={report.status} />
              </div>

              <Separator />

              {/* Reporter */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("reporter")}
                </p>
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {report.reporter.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {report.reporter.name ?? "N/A"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {report.reporter.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Signale le{" "}
                      {new Intl.DateTimeFormat("fr-TN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(report.createdAt))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reported user */}
              {report.reported && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reported")}
                  </p>
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive">
                      {report.reported.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {report.reported.name ?? "N/A"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {report.reported.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Report details */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("reason")}
                </p>
                <p className="rounded-md bg-muted p-3 text-sm">{report.reason}</p>
              </div>

              {report.description && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </p>
                  <p className="rounded-md bg-muted p-3 text-sm">
                    {report.description}
                  </p>
                  {/* AI reason tags for auto-flagged reviews */}
                  {report.type === "REVIEW" && report.description.startsWith("Auto-signalement IA:") && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {report.reason.split(", ").map((reason, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-orange-300 bg-orange-50 text-[10px] text-orange-700 dark:border-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                        >
                          IA: {reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {report.referenceId && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Reference
                  </p>
                  <p className="rounded-md bg-muted p-3 font-mono text-xs">
                    {report.referenceId}
                  </p>
                </div>
              )}

              <Separator />

              {/* Admin note */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("adminNote")}
                </p>
                {noteValue && !loading && (
                  <div className="mb-2 rounded-md bg-muted p-3 text-sm">
                    {noteValue}
                  </div>
                )}
                {report.status !== "RESOLVED" && report.status !== "DISMISSED" && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={t("adminNotePlaceholder")}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading || adminNote === noteValue}
                      onClick={handleSaveNote}
                    >
                      Enregistrer la note
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action buttons */}
              {report.status === "OPEN" && (
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={() => handleAction("INVESTIGATING")}
                >
                  {t("investigate")}
                </Button>
              )}

              {report.status === "INVESTIGATING" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    disabled={loading}
                    onClick={() => handleAction("RESOLVED")}
                  >
                    {t("resolve")}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleAction("DISMISSED")}
                  >
                    {t("dismiss")}
                  </Button>
                </div>
              )}

              {(report.status === "RESOLVED" || report.status === "DISMISSED") &&
                report.resolvedAt && (
                  <p className="text-center text-sm text-muted-foreground">
                    Cloture le{" "}
                    {new Intl.DateTimeFormat("fr-TN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(report.resolvedAt))}
                  </p>
                )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Aucun signalement selectionne</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
