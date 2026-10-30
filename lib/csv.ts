// Minimal RFC 4180 CSV writer for admin exports.

type Cell = string | number | boolean | Date | null | undefined;

function cell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  // Spreadsheet formula injection: text starting with = + - @ would be executed by Excel/Sheets.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV text with a UTF-8 BOM so Excel opens ₦ and accented names correctly. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
