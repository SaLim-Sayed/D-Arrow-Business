/** Assign a repeating four-color tone to consecutive date groups. */
export function dayToneByKey<T>(rows: T[], getDay: (row: T) => string): Map<string, number> {
  const tones = new Map<string, number>();
  let previousDay: string | undefined;
  let groupIndex = -1;

  for (const row of rows) {
    const day = getDay(row);
    if (day !== previousDay) {
      groupIndex += 1;
      previousDay = day;
    }
    tones.set(day, groupIndex % 4);
  }

  return tones;
}
