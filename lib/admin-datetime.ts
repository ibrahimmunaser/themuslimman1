/** Admin dashboards display timestamps in US Eastern (handles EST/EDT). */
export const ADMIN_TIMEZONE = "America/New_York";

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date + time for event tables (e.g. Jul 2, 2:07 PM ET). */
export function formatAdminDateTime(
  value: DateInput,
  opts?: { includeYear?: boolean; includeSeconds?: boolean }
): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    timeZone: ADMIN_TIMEZONE,
    month: "short",
    day: "numeric",
    ...(opts?.includeYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    ...(opts?.includeSeconds ? { second: "2-digit" } : {}),
    timeZoneName: "short",
  });
}

/** Date only (no time). */
export function formatAdminDate(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    timeZone: ADMIN_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
