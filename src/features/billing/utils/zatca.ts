/**
 * ZATCA (Zakat, Tax and Customs Authority) E-Invoicing Utilities
 * Implements Phase 1 QR Code generation using TLV (Tag-Length-Value) Base64 encoding
 */

/**
 * Generates a Base64 encoded TLV string for ZATCA QR Code
 * @param sellerName Company name
 * @param taxNumber 15-digit VAT number
 * @param timestamp ISO 8601 timestamp string (e.g. 2022-04-25T15:30:00Z)
 * @param invoiceTotal Total amount including VAT
 * @param vatTotal Total VAT amount
 */
export function generateZatcaQr(
  sellerName: string,
  taxNumber: string,
  timestamp: string,
  invoiceTotal: number,
  vatTotal: number
): string {
  // Convert each field to Tag-Length-Value format
  const getTlvBytes = (tag: number, value: string) => {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    
    // Tag and Length are 1 byte each
    const tagBytes = new Uint8Array([tag]);
    const lengthBytes = new Uint8Array([valueBytes.length]);
    
    const tlv = new Uint8Array(tagBytes.length + lengthBytes.length + valueBytes.length);
    tlv.set(tagBytes, 0);
    tlv.set(lengthBytes, 1);
    tlv.set(valueBytes, 2);
    
    return tlv;
  };

  const tlv1 = getTlvBytes(1, sellerName);
  const tlv2 = getTlvBytes(2, taxNumber);
  const tlv3 = getTlvBytes(3, timestamp);
  const tlv4 = getTlvBytes(4, invoiceTotal.toFixed(2));
  const tlv5 = getTlvBytes(5, vatTotal.toFixed(2));

  // Combine all TLV byte arrays
  const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
  const combined = new Uint8Array(totalLength);
  
  let offset = 0;
  combined.set(tlv1, offset); offset += tlv1.length;
  combined.set(tlv2, offset); offset += tlv2.length;
  combined.set(tlv3, offset); offset += tlv3.length;
  combined.set(tlv4, offset); offset += tlv4.length;
  combined.set(tlv5, offset);
  
  // Convert to Base64
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  
  return btoa(binary);
}
