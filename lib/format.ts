const dateFormat = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Lagos",
});

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** → "30 Oct 2026" (Lagos time) */
export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** → "30 Oct 2026, 14:05" (Lagos time) */
export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

/** Current year and month in Lagos — defaults for season and harvest month. */
export function lagosToday(): { year: number; month: number } {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  return { year: Number(y), month: Number(m) };
}

/** Whole days elapsed since `date` (at least 1) — e.g. days on the drying platform. */
export function daysSince(date: Date): number {
  return Math.max(1, Math.round((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)));
}
