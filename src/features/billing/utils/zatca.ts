/**
 * ZATCA Phase 1 QR — TLV (Tag-Length-Value) then Base64.
 * Length must be UTF-8 byte length (critical for Arabic seller names).
 */

function toZatcaTimestamp(timestamp: string | Date): string {
  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  // ZATCA expects ISO-8601 UTC without fractional seconds
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Keep digits only — Saudi VAT / TRN is 15 digits. */
export function normalizeZatcaVat(taxNumber: string): string {
  return taxNumber.replace(/\D/g, "");
}

function getTlvBytes(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  let valueBytes = encoder.encode(value);

  // Length field is a single byte (max 255)
  if (valueBytes.length > 255) {
    valueBytes = valueBytes.slice(0, 255);
  }

  const tlv = new Uint8Array(2 + valueBytes.length);
  tlv[0] = tag;
  tlv[1] = valueBytes.length;
  tlv.set(valueBytes, 2);
  return tlv;
}

/**
 * Generates a Base64 TLV payload for the ZATCA Phase 1 QR code.
 */
export function generateZatcaQr(
  sellerName: string,
  taxNumber: string,
  timestamp: string | Date,
  invoiceTotal: number,
  vatTotal: number
): string {
  const name = sellerName.trim() || "Seller";
  const vat = normalizeZatcaVat(taxNumber);
  const ts = toZatcaTimestamp(timestamp);
  const total = Number.isFinite(invoiceTotal) ? invoiceTotal : 0;
  const tax = Number.isFinite(vatTotal) ? vatTotal : 0;

  const parts = [
    getTlvBytes(1, name),
    getTlvBytes(2, vat),
    getTlvBytes(3, ts),
    getTlvBytes(4, total.toFixed(2)),
    getTlvBytes(5, tax.toFixed(2)),
  ];

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]!);
  }

  return btoa(binary);
}

/** True when tax number is a full Saudi 15-digit VAT / TRN. */
export function canShowZatcaQr(taxNumber?: string | null): boolean {
  return normalizeZatcaVat(taxNumber ?? "").length === 15;
}
