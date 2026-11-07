import "server-only";

/**
 * Shared date-range resolution for admin analytics pages. Supports quick
 * presets (?range=7d) and a custom range (?from=YYYY-MM-DD&to=YYYY-MM-DD).
 * A custom from/to always takes priority over a preset.
 */

export type AdminDateRangeParams = {
  range?: string;
  from?: string;
  to?: string;
};

export type AdminDateRange = {
  /** Inclusive start, or undefined for "all time". */
  from?: Date;
  /** Inclusive end, or undefined for "all time". */
  to?: Date;
  /** Which preset is active, for highlighting the right pill. "custom" when from/to were set directly. */
  preset: "all" | "today" | "7d" | "30d" | "90d" | "custom";
  label: string;
  /** Raw YYYY-MM-DD strings for pre-filling the custom date inputs. */
  fromInput: string;
  toInput: string;
};

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function toInputString(d?: Date) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function resolveAdminDateRange(params: AdminDateRangeParams): AdminDateRange {
  const { range, from, to } = params;

  // Custom range (either side) always wins over a preset.
  if (from || to) {
    const fromDate = from ? startOfDay(new Date(`${from}T00:00:00`)) : undefined;
    const toDate = to ? endOfDay(new Date(`${to}T00:00:00`)) : undefined;
    return {
      from: fromDate,
      to: toDate,
      preset: "custom",
      label: "Custom range",
      fromInput: from ?? "",
      toInput: to ?? "",
    };
  }

  const now = new Date();
  const todayEnd = endOfDay(now);

  const presetMap: Record<string, { days: number; label: string }> = {
    today: { days: 0, label: "Today" },
    "7d": { days: 6, label: "Last 7 days" },
    "30d": { days: 29, label: "Last 30 days" },
    "90d": { days: 89, label: "Last 90 days" },
  };

  if (range && range in presetMap) {
    const { days, label } = presetMap[range];
    const start = startOfDay(now);
    start.setDate(start.getDate() - days);
    return {
      from: start,
      to: todayEnd,
      preset: range as "today" | "7d" | "30d" | "90d",
      label,
      fromInput: toInputString(start),
      toInput: toInputString(todayEnd),
    };
  }

  return { from: undefined, to: undefined, preset: "all", label: "All time", fromInput: "", toInput: "" };
}

/** Prisma `createdAt` where-clause fragment for a resolved range. Empty object = no filter. */
export function createdAtWhere(dateRange: AdminDateRange) {
  if (!dateRange.from && !dateRange.to) return {};
  return {
    createdAt: {
      ...(dateRange.from ? { gte: dateRange.from } : {}),
      ...(dateRange.to ? { lte: dateRange.to } : {}),
    },
  };
}

/** Same, but for a `sentAt` column (email events/logs). */
export function sentAtWhere(dateRange: AdminDateRange) {
  if (!dateRange.from && !dateRange.to) return {};
  return {
    sentAt: {
      ...(dateRange.from ? { gte: dateRange.from } : {}),
      ...(dateRange.to ? { lte: dateRange.to } : {}),
    },
  };
}
