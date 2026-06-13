const DEFAULT_COUNTRY_CODE = "20";

/** Strip to digits only for wa.me links and matching. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/** Convert local/mobile numbers to international digits for WhatsApp (e.g. 010… → 2010…). */
export function toInternationalWhatsAppPhone(
  phone: string,
  countryCode = DEFAULT_COUNTRY_CODE
): string {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return "";

  if (digits.startsWith(countryCode) && digits.length > countryCode.length + 8) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `${countryCode}${digits.slice(1)}`;
  }

  return digits;
}

export function isValidWhatsAppPhone(phone: string | null | undefined): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 8 && digits.length <= 15;
}

export function buildWhatsAppUrl(
  phone: string,
  message?: string
): string | null {
  const digits = toInternationalWhatsAppPhone(phone);
  if (!isValidWhatsAppPhone(digits)) return null;

  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  const digits = toInternationalWhatsAppPhone(phone ?? "");
  if (!digits) return "";
  if (digits.startsWith("20") && digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  }
  if (digits.length >= 10) return `+${digits}`;
  return phone ?? "";
}
