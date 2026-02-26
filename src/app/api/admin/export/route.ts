import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getExportDataAction } from "@/features/admin/actions/export-actions";
import { generateCsv } from "@/features/admin/lib/csv-generator";
import { generatePdfHtml } from "@/features/admin/lib/pdf-generator";
import type { ExportType } from "@/features/admin/actions/export-actions";

// ============================================================
// VALID EXPORT TYPES AND FORMATS
// ============================================================

const VALID_TYPES: ExportType[] = [
  "users",
  "services",
  "transactions",
  "revenue",
  "reports",
  "analytics",
];

const VALID_FORMATS = ["csv", "pdf"] as const;
type ExportFormat = (typeof VALID_FORMATS)[number];

// ============================================================
// GET /api/admin/export
// ============================================================

/**
 * GET /api/admin/export?type={type}&format={csv|pdf}&columns={key1,key2,...}&startDate=...&endDate=...
 *
 * Validates ADMIN session, fetches full dataset, generates CSV or printable HTML.
 *
 * Query params:
 * - type: "users" | "services" | "transactions" | "revenue" | "reports" (required)
 * - format: "csv" | "pdf" (required)
 * - columns: comma-separated column keys to include (optional — defaults to all)
 * - startDate: ISO date string for filter range (optional)
 * - endDate: ISO date string for filter range (optional)
 *
 * CSV response: Content-Type text/csv + Content-Disposition attachment
 * PDF response: Content-Type text/html (client opens in new tab for printing)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Auth check ──────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Non authentifie" },
      { status: 401 },
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Acces reserve aux administrateurs" },
      { status: 403 },
    );
  }

  // ── Parse query params ───────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ExportType | null;
  const format = searchParams.get("format") as ExportFormat | null;
  const columnsParam = searchParams.get("columns");
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  // ── Validate params ──────────────────────────────────────────
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error: `Type invalide. Valeurs acceptees: ${VALID_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (!format || !VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: "Format invalide. Valeurs acceptees: csv, pdf" },
      { status: 400 },
    );
  }

  // ── Fetch export data ────────────────────────────────────────
  const result = await getExportDataAction(type, { startDate, endDate });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 },
    );
  }

  let { columns, data } = result.data;

  // ── Column filtering ─────────────────────────────────────────
  if (columnsParam) {
    const requestedKeys = new Set(columnsParam.split(",").map((k) => k.trim()));
    columns = columns.filter((col) => requestedKeys.has(col.key));
  }

  // ── Generate response ────────────────────────────────────────
  const dateStr = new Date().toISOString().split("T")[0] ?? "export";

  if (format === "csv") {
    const csv = generateCsv(columns, data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tawa-${type}-${dateStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // format === "pdf"
  const typeLabels: Record<ExportType, string> = {
    users: "Utilisateurs",
    services: "Services",
    transactions: "Transactions",
    revenue: "Revenus mensuels",
    reports: "Signalements",
    analytics: "Analytique (Transactions + Revenus)",
  };

  const title = `Rapport ${typeLabels[type]}`;
  const generatedAt = new Intl.DateTimeFormat("fr-TN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  let dateRange: string | undefined;
  if (startDate && endDate) {
    dateRange = `${startDate} — ${endDate}`;
  }

  const html = generatePdfHtml(title, columns, data, {
    generatedAt,
    generatedBy: session.user.name ?? "Administrateur",
    dateRange,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
