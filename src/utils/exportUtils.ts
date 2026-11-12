/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CsvCell = string | number | boolean | null | undefined;

/**
 * Escapes a single CSV cell according to RFC 4180.
 */
export function escapeCsvCell(value: CsvCell): string {
  const str = value === null || value === undefined ? '' : String(value);
  const safe = str.replace(/"/g, '""');
  return `"${safe}"`;
}

/**
 * Builds an RFC-4180 CSV string with UTF-8 BOM for proper Excel rendering (including INR ₹).
 */
export function buildCsv(rows: CsvCell[][]): string {
  const body = rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
  return `\uFEFF${body}`;
}

/**
 * Triggers a client-side CSV file download using a Blob URL.
 */
export function downloadCsvFile(filename: string, rows: CsvCell[][]): void {
  const csvContent = buildCsv(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

