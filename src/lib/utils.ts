import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
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

  if (isSarCurrency(code)) {
    const formatted = amount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
      ...options,
    });
    return `${formatted} \u20C1`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${code}`;
  }
}
