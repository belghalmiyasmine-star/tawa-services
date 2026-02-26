/**
 * PDF Generator — generates a printable HTML document.
 * No external PDF library required — the browser prints to PDF via window.print().
 *
 * Served as Content-Type text/html, opened in new tab by client.
 */

export type PdfColumn = {
  key: string;
  label: string;
};

export type PdfMetadata = {
  generatedAt: string;
  generatedBy: string;
  dateRange?: string;
};

/**
 * Generate a complete, printable HTML document with embedded CSS.
 * Returns the full HTML string to be served as text/html.
 */
export function generatePdfHtml(
  title: string,
  columns: PdfColumn[],
  data: Record<string, unknown>[],
  metadata?: PdfMetadata,
): string {
  const generatedAt = metadata?.generatedAt ?? new Date().toLocaleString("fr-TN");
  const generatedBy = metadata?.generatedBy ?? "Administrateur";
  const dateRange = metadata?.dateRange ?? "";

  function escapeHtml(value: unknown): string {
    const str = value == null ? "" : String(value);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const headerCells = columns
    .map((col) => `<th>${escapeHtml(col.label)}</th>`)
    .join("");

  const dataRows = data
    .map((row, index) => {
      const cells = columns
        .map((col) => `<td>${escapeHtml(row[col.key])}</td>`)
        .join("");
      const rowClass = index % 2 === 0 ? "row-even" : "row-odd";
      return `<tr class="${rowClass}">${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — Tawa Services</title>
  <style>
    /* === Reset & Base === */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
      padding: 20px;
    }

    /* === Header === */
    .report-header {
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a2e;
      letter-spacing: 1px;
    }
    .report-title {
      font-size: 16px;
      font-weight: bold;
      margin-top: 6px;
      color: #333;
    }
    .report-meta {
      margin-top: 6px;
      font-size: 11px;
      color: #666;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    /* === Table === */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    thead tr {
      background-color: #1a1a2e;
      color: #fff;
    }
    thead th {
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
      white-space: nowrap;
    }
    tbody td {
      padding: 7px 10px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11px;
      word-break: break-word;
    }
    .row-even { background-color: #f9f9f9; }
    .row-odd  { background-color: #ffffff; }
    tbody tr:last-child td { border-bottom: none; }

    /* === Empty state === */
    .empty-state {
      padding: 20px;
      text-align: center;
      color: #999;
      font-style: italic;
    }

    /* === Footer === */
    .report-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e5e5;
      font-size: 10px;
      color: #999;
      text-align: center;
    }

    /* === Print === */
    @media print {
      body { padding: 10px; }
      @page {
        margin: 15mm;
        @bottom-center {
          content: "Page " counter(page) " sur " counter(pages);
          font-size: 10px;
          color: #999;
        }
      }
      .no-print { display: none !important; }
      thead { display: table-header-group; }
      tbody tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Print trigger button (hidden in print) -->
  <div class="no-print" style="text-align:right; margin-bottom: 12px;">
    <button onclick="window.print()" style="
      padding: 8px 16px;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">
      Imprimer / Telecharger PDF
    </button>
  </div>

  <!-- Report Header -->
  <div class="report-header">
    <div class="brand">TAWA SERVICES</div>
    <div class="report-title">${escapeHtml(title)}</div>
    <div class="report-meta">
      <span>Genere le : ${escapeHtml(generatedAt)}</span>
      <span>Genere par : ${escapeHtml(generatedBy)}</span>
      ${dateRange ? `<span>Periode : ${escapeHtml(dateRange)}</span>` : ""}
    </div>
  </div>

  <!-- Data Table -->
  ${
    data.length === 0
      ? `<div class="empty-state">Aucune donnee a afficher pour cette periode.</div>`
      : `
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>
  <div style="margin-top: 8px; font-size: 10px; color: #999;">
    Total : ${data.length} enregistrement${data.length > 1 ? "s" : ""}
  </div>
  `
  }

  <!-- Footer -->
  <div class="report-footer">
    Genere par Tawa Services &mdash; Rapport confidentiel
  </div>

</body>
</html>`;
}
