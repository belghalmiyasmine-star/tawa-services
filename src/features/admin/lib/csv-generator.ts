/**
 * CSV Generator utility — RFC 4180 compliant with UTF-8 BOM for Excel compatibility.
 * No external dependencies — pure string manipulation.
 */

export type CsvColumn = {
  key: string;
  label: string;
};

/**
 * Generate a RFC 4180 compliant CSV string from columns and data rows.
 *
 * - Header row uses column labels (French labels for admin export).
 * - Values containing commas, newlines, or double quotes are enclosed in double quotes.
 * - Double quotes within values are escaped by doubling them ("" per RFC 4180).
 * - UTF-8 BOM (\uFEFF) prepended for Excel compatibility with French/accented characters.
 */
export function generateCsv(
  columns: CsvColumn[],
  data: Record<string, unknown>[],
): string {
  const BOM = "\uFEFF";

  function escapeCell(value: unknown): string {
    const str = value == null ? "" : String(value);
    // Needs quoting if contains comma, newline, or double quote
    if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
      // Escape double quotes by doubling them
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // Header row
  const header = columns.map((col) => escapeCell(col.label)).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeCell(row[col.key])).join(","),
  );

  return BOM + [header, ...rows].join("\r\n");
}
