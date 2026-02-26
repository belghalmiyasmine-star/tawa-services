"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProviderPayoutItem } from "../actions/commission-queries";

// ============================================================
// TYPES
// ============================================================

interface ProviderPayoutsTableProps {
  providers: ProviderPayoutItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

// ============================================================
// HELPERS
// ============================================================

function formatTND(amount: number): string {
  return new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " TND";
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// ============================================================
// COMPONENT
// ============================================================

export function ProviderPayoutsTable({
  providers,
  total,
  currentPage,
  pageSize,
  onPageChange,
}: ProviderPayoutsTableProps) {
  const t = useTranslations("admin.commission");
  const tCommon = useTranslations("admin.common");

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  if (providers.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card py-16">
        <p className="text-muted-foreground">{tCommon("noResults")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">
              {t("providerName")}
            </TableHead>
            <TableHead className="font-medium">
              {t("earnings")}
            </TableHead>
            <TableHead className="hidden font-medium md:table-cell">
              {t("commission")} (12%)
            </TableHead>
            <TableHead className="font-medium">
              En attente
            </TableHead>
            <TableHead className="font-medium">
              Retraits
            </TableHead>
            <TableHead className="hidden font-medium lg:table-cell">
              {t("lastPayout")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.userId}>
              <TableCell>
                <span className="font-semibold">{provider.displayName}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-700">
                  {formatTND(provider.totalEarnings)}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-muted-foreground">
                  {formatTND(provider.totalCommission)}
                </span>
              </TableCell>
              <TableCell>
                {provider.pendingAmount > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-700"
                  >
                    {formatTND(provider.pendingAmount)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {formatTND(provider.withdrawalsTotal)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-muted-foreground">
                  {formatDate(provider.lastPayoutDate)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {tCommon("showing")} {startItem}-{endItem} {tCommon("of")}{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon("previous")}</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {tCommon("page")} {currentPage} {tCommon("of")} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="hidden sm:inline">{tCommon("next")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
