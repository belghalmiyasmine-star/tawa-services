"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KycSubmissionSummary } from "@/features/kyc/actions/review-kyc";

interface KycSubmissionListProps {
  submissions: KycSubmissionSummary[];
}

type SortOrder = "asc" | "desc";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function KycSubmissionList({ submissions }: KycSubmissionListProps) {
  const t = useTranslations("kyc");
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sorted = [...submissions].sort((a, b) => {
    const aTime = new Date(a.submittedAt).getTime();
    const bTime = new Date(b.submittedAt).getTime();
    return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
  });

  function toggleSort() {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function handleRowClick(providerId: string) {
    router.push(`/admin/kyc/${providerId}`);
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">
          {t("adminNoSubmissions")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestataire</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>
              <button
                onClick={toggleSort}
                className="flex items-center gap-1 font-medium hover:text-foreground"
              >
                {t("submittedAt")}
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((submission) => (
            <TableRow
              key={submission.providerId}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleRowClick(submission.providerId)}
            >
              <TableCell className="font-medium">
                {submission.displayName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {submission.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(submission.submittedAt)}
              </TableCell>
              <TableCell>
                <span className="tabular-nums">{submission.documentCount}</span>
              </TableCell>
              <TableCell>
                {submission.isOverdue ? (
                  <Badge variant="destructive" className="flex w-fit items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t("adminOverdue")}
                  </Badge>
                ) : (
                  <Badge variant="outline">En attente</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
