export type DateRangePreset =
  | "all"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "custom";

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: Date | null,
  customEnd?: Date | null
): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();

  switch (preset) {
    case "this_month": {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "last_month": {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "this_quarter": {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "this_year": {
      const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "custom": {
      const startDate = customStart ? new Date(customStart) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      const endDate = customEnd ? new Date(customEnd) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    case "all":
    default:
      return { startDate: null, endDate: null };
  }
}

export function isDateWithinRange(
  targetDate?: Date | string | null,
  startDate?: Date | null,
  endDate?: Date | null
): boolean {
  if (!targetDate) return true;
  const d = new Date(targetDate);
  if (isNaN(d.getTime())) return true;

  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

export function filterItemsByDateRange<
  T extends { date?: Date | string; issueDate?: Date | string; createdAt?: Date | string }
>(items: T[], startDate?: Date | null, endDate?: Date | null): T[] {
  if (!startDate && !endDate) return items;
  return items.filter((item) => {
    const itemDate = item.issueDate ?? item.date ?? item.createdAt;
    return isDateWithinRange(itemDate, startDate, endDate);
  });
}
