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

const ISO_CURRENCY_CODE = /^[A-Z]{3}$/;

export function isSarCurrency(currency?: string | null) {
  const code = (currency ?? "").trim().toUpperCase();
  return code === "SAR" || code === "ريال";
}

/** Returns a valid ISO 4217 code, defaulting to USD when invalid. */
export function normalizeCurrencyCode(currency: string | null | undefined): string {
  const code = (currency ?? "").trim().toUpperCase();
  if (!ISO_CURRENCY_CODE.test(code)) return "USD";

  try {
    new Intl.NumberFormat(undefined, { style: "currency", currency: code });
    return code;
  } catch {
    return "USD";
  }
}

export function formatCurrency(
  amount: number,
  currency?: string | null,
  options?: Intl.NumberFormatOptions
): string {
  const code = normalizeCurrencyCode(currency);
  const currentLang = i18n.language || "en";
  const fractionDigits = options?.maximumFractionDigits ?? 2;

  if (isSarCurrency(code)) {
    const formatted = amount.toLocaleString(currentLang.startsWith("ar") ? "ar-SA" : currentLang, {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
      ...options,
    });
    return currentLang.startsWith("ar") ? `${formatted} ر.س` : `${formatted} SAR`;
  }

  const absFormatted = new Intl.NumberFormat(
    currentLang.startsWith("ar") ? "ar-SA" : currentLang,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
      ...options,
    }
  ).format(Math.abs(amount));

  const sign = amount < 0 ? "-" : "";

  if (code === "USD") {
    return `${sign}$${absFormatted}`;
  }

  try {
    if (!currentLang.startsWith("ar")) {
      return new Intl.NumberFormat(currentLang, {
        style: "currency",
        currency: code,
        maximumFractionDigits: fractionDigits,
        ...options,
      }).format(amount);
    }

    return `${sign}${absFormatted}\u00A0${code}`;
  } catch {
    return `${sign}${absFormatted} ${code}`;
  }
}
