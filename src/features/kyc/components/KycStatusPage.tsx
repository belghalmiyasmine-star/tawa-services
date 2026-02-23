"use client";

import { BadgeCheck, Hourglass, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface KycStatusPageProps {
  status: KycStatus;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectedReason?: string | null;
  onResubmit: () => void;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function KycStatusPage({
  status,
  submittedAt,
  approvedAt,
  rejectedAt,
  rejectedReason,
  onResubmit,
}: KycStatusPageProps) {
  const t = useTranslations("kyc");

  if (status === "NOT_SUBMITTED") {
    // Should not normally render — page redirects to wizard
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Status header card */}
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          {status === "PENDING" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Hourglass className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  {t("statusPending")}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {t("submitConfirmDescription")}
                </p>
              </div>
            </>
          )}

          {status === "APPROVED" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <BadgeCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                >
                  {t("statusApproved")}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {t("badgeTooltip")}
                </p>
              </div>
            </>
          )}

          {status === "REJECTED" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                >
                  {t("statusRejected")}
                </Badge>
                {rejectedReason && (
                  <div className="rounded-md bg-red-50 p-3 text-left dark:bg-red-900/20">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      {t("rejectionReason")}
                    </p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                      {rejectedReason}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Timeline card */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Historique
        </h3>
        <ol className="relative space-y-4 border-l border-border pl-6">
          {submittedAt && (
            <TimelineItem
              label={t("submittedAt")}
              date={formatDate(submittedAt)}
              isComplete
            />
          )}
          {approvedAt && (
            <TimelineItem
              label={t("approvedAt")}
              date={formatDate(approvedAt)}
              isComplete
              variant="success"
            />
          )}
          {rejectedAt && (
            <TimelineItem
              label={t("rejectedAt")}
              date={formatDate(rejectedAt)}
              isComplete
              variant="danger"
            />
          )}
          {status === "PENDING" && (
            <TimelineItem
              label="En cours de traitement"
              date=""
              isComplete={false}
            />
          )}
        </ol>
      </Card>

      {/* Resubmit button for REJECTED */}
      {status === "REJECTED" && (
        <Button
          type="button"
          onClick={onResubmit}
          className="w-full"
          variant="default"
        >
          {t("resubmitButton")}
        </Button>
      )}
    </div>
  );
}

// Timeline item subcomponent
interface TimelineItemProps {
  label: string;
  date: string;
  isComplete: boolean;
  variant?: "default" | "success" | "danger";
}

function TimelineItem({
  label,
  date,
  isComplete,
  variant = "default",
}: TimelineItemProps) {
  const dotColor =
    variant === "success"
      ? "bg-green-500"
      : variant === "danger"
        ? "bg-red-500"
        : isComplete
          ? "bg-primary"
          : "border-2 border-border bg-background";

  return (
    <li className="relative">
      <div
        className={[
          "absolute -left-[1.65rem] top-0.5 h-4 w-4 rounded-full",
          dotColor,
        ].join(" ")}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {date && <p className="text-xs text-muted-foreground">{date}</p>}
      </div>
    </li>
  );
}
