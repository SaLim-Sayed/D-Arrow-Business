import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any): string {
  if (!date) return "—";
  
  let d: Date;
  if (typeof date.toDate === "function") {
    d = date.toDate();
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "—";

  const currentLang = i18n.language || "en";
  return new Intl.DateTimeFormat(currentLang, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function generateId(): string {
  return crypto.randomUUID();
}

/** App display currency is always Saudi Riyal. */
export const APP_CURRENCY = "SAR";

/** Official Unicode Saudi Riyal Sign (U+20C1) for plain-text / CSV only. Prefer <MoneyAmount /> in UI. */
export const RIYAL_SIGN = "\u20C1";

export function isSarCurrency(_currency?: string | null) {
  return true;
}

/** Always returns SAR — any other stored code is remapped for display/storage defaults. */
export function normalizeCurrencyCode(_currency?: string | null): string {
  return APP_CURRENCY;
}

/** Formats amount for plain text. UI should use <MoneyAmount /> for the SVG رiyal mark. */
export function formatCurrency(
  amount: number,
  _currency?: string | null,
  options?: Intl.NumberFormatOptions
): string {
  const currentLang = i18n.language || "en";
  const fractionDigits = options?.maximumFractionDigits ?? 2;
  const locale = currentLang.startsWith("ar") ? "ar-SA" : currentLang;

  const formatted = amount.toLocaleString(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
    ...options,
  });

  return `${formatted}\u00A0${RIYAL_SIGN}`;
}
