/**
 * Dependency-free CSV helpers (RFC 4180 quoting).
 * Shared by the GitHub export route and the in-app CSV downloads.
 */

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvValue).join(',')];
  for (const row of rows) lines.push(row.map(escapeCsvValue).join(','));
  return lines.join('\r\n') + '\r\n';
}

/** Browser helper: trigger a CSV file download. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
