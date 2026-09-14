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

/** Turn `khulod.ahmed390@gmail.com` into `Khulod Ahmed390`. */
export function nameFromEmail(email?: string | null): string {
  const local = email?.split("@")[0]?.trim();
  if (!local) return "";
  return local
    .replace(/[._+-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * First letter of the first two words, dot-separated: `Salim Sayed` → `S.S`.
 * A single-word name yields a single letter with no dot.
 */
export function initialsFromName(name: string, fallback = "?"): string {
  const parts = name
    .replace(/@.*$/, "")
    .split(/[\s._+-]+/)
    .filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join(".");
}
