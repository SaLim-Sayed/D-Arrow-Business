/**
 * Prefer Arabic when the UI locale is Arabic; fall back to English (or the reverse).
 * Empty / whitespace-only values count as missing.
 */
export function localizedName(
  locale: string | undefined,
  names: { name?: string | null; nameAr?: string | null }
): string {
  const en = names.name?.trim() || "";
  const ar = names.nameAr?.trim() || "";
  if ((locale ?? "").toLowerCase().startsWith("ar")) return ar || en;
  return en || ar;
}
