/** Return every second date group so all rows from one day share a background. */
export function alternatingDayKeys<T>(rows: T[], getDay: (row: T) => string): Set<string> {
  const tintedDays = new Set<string>();
  let previousDay: string | undefined;
  let tint = false;

  for (const row of rows) {
    const day = getDay(row);
    if (day !== previousDay) {
      tint = previousDay === undefined ? false : !tint;
      previousDay = day;
    }
    if (tint) tintedDays.add(day);
  }

  return tintedDays;
}
