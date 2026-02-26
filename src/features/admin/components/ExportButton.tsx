"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ExportType } from "../actions/export-actions";

// ============================================================
// TYPES
// ============================================================

export type ExportColumn = {
  key: string;
  label: string;
};

interface ExportButtonProps {
  exportType: ExportType;
  availableColumns: ExportColumn[];
  startDate?: string;
  endDate?: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Reusable export button with dropdown for column selection and format choice.
 *
 * - Shows a dropdown menu with:
 *   - Column selection (all checked by default)
 *   - CSV download (attachment)
 *   - PDF export (opens in new tab for printing)
 * - Uses /api/admin/export route for file generation.
 */
export function ExportButton({
  exportType,
  availableColumns,
  startDate,
  endDate,
}: ExportButtonProps) {
  const t = useTranslations("admin.analytics");

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(availableColumns.map((col) => col.key)),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [open, setOpen] = useState(false);

  // ── Column toggle ─────────────────────────────────────────────
  function toggleColumn(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Prevent deselecting all columns
        if (next.size > 1) {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // ── Build export URL ──────────────────────────────────────────
  function buildUrl(format: "csv" | "pdf"): string {
    const params = new URLSearchParams({
      type: exportType,
      format,
      columns: Array.from(selectedKeys).join(","),
    });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/api/admin/export?${params.toString()}`;
  }

  // ── CSV download (fetch + blob to track loading state) ───────
  async function handleCsvDownload() {
    setIsDownloading(true);
    setOpen(false);
    try {
      const url = buildUrl("csv");
      const response = await fetch(url);

      if (!response.ok) {
        console.error("[ExportButton] CSV fetch failed:", response.status);
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `tawa-${exportType}-export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL after short delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("[ExportButton] CSV download error:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  // ── PDF export (open in new tab for printing) ────────────────
  function handlePdfExport() {
    setOpen(false);
    const url = buildUrl("pdf");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasColumns = selectedKeys.size > 0;
  const useScrollArea = availableColumns.length > 8;

  // ── Render ────────────────────────────────────────────────────
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isDownloading ? "Exportation..." : "Exporter"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Column selection */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Colonnes a exporter
        </DropdownMenuLabel>

        {useScrollArea ? (
          <ScrollArea className="h-48">
            <div className="px-2 pb-2">
              {availableColumns.map((col) => (
                <ColumnItem
                  key={col.key}
                  col={col}
                  checked={selectedKeys.has(col.key)}
                  onToggle={() => toggleColumn(col.key)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="px-2 pb-2">
            {availableColumns.map((col) => (
              <ColumnItem
                key={col.key}
                col={col}
                checked={selectedKeys.has(col.key)}
                onToggle={() => toggleColumn(col.key)}
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Format buttons */}
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={!hasColumns}
          onSelect={(e) => {
            e.preventDefault();
            void handleCsvDownload();
          }}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          {t("exportCsv")}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          disabled={!hasColumns}
          onSelect={(e) => {
            e.preventDefault();
            handlePdfExport();
          }}
        >
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          {t("exportPdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// SUB-COMPONENT: Column checkbox item
// ============================================================

function ColumnItem({
  col,
  checked,
  onToggle,
}: {
  col: ExportColumn;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent"
      onClick={onToggle}
    >
      <Checkbox
        id={`col-${col.key}`}
        checked={checked}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4"
      />
      <label
        htmlFor={`col-${col.key}`}
        className="cursor-pointer text-sm font-normal"
      >
        {col.label}
      </label>
    </div>
  );
}
