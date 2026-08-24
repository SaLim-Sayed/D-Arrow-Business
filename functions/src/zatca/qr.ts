/**
 * ZATCA Phase 2 QR (TLV -> Base64), tags 1-9.
 * Tags verified against ZATCA's "Electronic Invoice Security Features
 * Implementation Standards" PDF (Table 3):
 *   1 seller name · 2 VAT number · 3 timestamp (ISO 8601) · 4 invoice total
 *   5 VAT total · 6 invoice XML hash · 7 ECDSA signature of the hash
 *   8 ECDSA public key · 9 ECDSA signature of the cryptographic stamp
 *     (issued by ZATCA's technical CA over the certificate) — simplified
 *     invoices only; for standard/cleared invoices tag 9 may be omitted,
 *     VERIFY against your invoice type.
 */

function tlv(tag: number, value: Buffer): Buffer {
  const len = Math.min(value.length, 255);
  const header = Buffer.from([tag, len]);
  return Buffer.concat([header, value.subarray(0, len)]);
}

export interface Phase2QrInput {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  invoiceTotal: number;
  vatTotal: number;
  invoiceHashBase64: string;
  ecdsaSignatureBase64: string;
  ecdsaPublicKeyBase64: string;
  certSignatureBase64?: string;
}

export function buildPhase2Qr(input: Phase2QrInput): string {
  const parts = [
    tlv(1, Buffer.from(input.sellerName, "utf8")),
    tlv(2, Buffer.from(input.vatNumber, "utf8")),
    tlv(3, Buffer.from(input.timestampIso, "utf8")),
    tlv(4, Buffer.from(input.invoiceTotal.toFixed(2), "utf8")),
    tlv(5, Buffer.from(input.vatTotal.toFixed(2), "utf8")),
    tlv(6, Buffer.from(input.invoiceHashBase64, "base64")),
    tlv(7, Buffer.from(input.ecdsaSignatureBase64, "base64")),
    tlv(8, Buffer.from(input.ecdsaPublicKeyBase64, "base64")),
  ];
  if (input.certSignatureBase64) {
    parts.push(tlv(9, Buffer.from(input.certSignatureBase64, "base64")));
  }
  return Buffer.concat(parts).toString("base64");
}
