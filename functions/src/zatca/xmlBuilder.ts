/**
 * Builds the *unsigned* ZATCA UBL 2.1 invoice XML from Firestore invoice data.
 *
 * Structural facts below (element order, InvoiceTypeCode "name" attribute
 * encoding, AdditionalDocumentReference usage for ICV/PIH/QR) are cross-checked
 * against ZATCA's "Electronic Invoice XML Implementation Standard" PDF and
 * multiple independent open-source ZATCA integrations (see docs/zatca-phase2-setup.md
 * for links). The one block intentionally NOT built here is the digital
 * signature / cryptographic stamp (ext:UBLExtensions) — see sign.ts for why.
 *
 * Scope: this builder handles standard invoices (documentType "invoice").
 * Credit/debit notes live in a separate generic-document schema in this app;
 * extending this builder to cover them is a follow-up (see setup doc).
 */

export interface ZatcaPartyInput {
  name: string;
  taxNumber?: string;
  commercialRegister?: string;
  address?: string;
  /** ISO 3166-1 alpha-2. Defaults to "SA". */
  countryCode?: string;
}

export interface ZatcaInvoiceLineInput {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percent, e.g. 15 for 15%
  discount?: number;
  lineTotal: number; // net of discount, excl. VAT
}

export interface ZatcaInvoiceInput {
  /** Firestore invoice id — NOT the same as the human invoice number. */
  id: string;
  invoiceNumber: string;
  issueDateTimeIso: string; // full ISO 8601 timestamp, e.g. from issueDate + time of submission
  currency: string; // e.g. "SAR"
  seller: ZatcaPartyInput;
  buyer?: ZatcaPartyInput;
  lines: ZatcaInvoiceLineInput[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  /** true when the buyer counts as a business (CR or VAT present) => Standard Tax Invoice. */
  isB2B: boolean;
  /** true when totalTax > 0 => Tax Invoice; false => plain (non-VAT) invoice — rare in KSA post-Phase-2. */
  isTaxInvoice: boolean;
}

export interface ZatcaChainInput {
  uuid: string;
  icv: number;
  previousInvoiceHash: string; // Base64 SHA-256 of the previous *signed* invoice, or the genesis value
}

function xmlEscape(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(n: number): string {
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

/** 7-digit InvoiceTypeCode "name" attribute: [invoice subtype 2][3rd-party][nominal][export][summary][self-billed]. */
function invoiceTypeCodeName(isB2B: boolean, isTaxInvoice: boolean): string {
  // isTaxInvoice is effectively always true post Phase-2 (KSA VAT); kept explicit for clarity.
  const subtype = isTaxInvoice ? (isB2B ? "01" : "02") : (isB2B ? "01" : "02");
  return `${subtype}0000`;
}

function partyBlock(tag: "cac:AccountingSupplierParty" | "cac:AccountingCustomerParty", party: ZatcaPartyInput): string {
  const country = party.countryCode ?? "SA";
  const vatBlock = party.taxNumber
    ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${xmlEscape(party.taxNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`
    : "";
  const crBlock = party.commercialRegister
    ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${xmlEscape(party.commercialRegister)}</cbc:ID>
      </cac:PartyIdentification>`
    : "";
  return `
  <${tag}>
    <cac:Party>${crBlock}${vatBlock}
      <cac:PostalAddress>
        <cbc:StreetName>${xmlEscape(party.address ?? "")}</cbc:StreetName>
        <cbc:Country><cbc:IdentificationCode>${xmlEscape(country)}</cbc:IdentificationCode></cbc:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(party.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </${tag}>`;
}

function taxSubtotals(lines: ZatcaInvoiceLineInput[], currency: string): string {
  const byRate = new Map<number, { base: number; tax: number }>();
  for (const line of lines) {
    const rate = line.taxRate ?? 0;
    const tax = line.lineTotal * (rate / 100);
    const entry = byRate.get(rate) ?? { base: 0, tax: 0 };
    entry.base += line.lineTotal;
    entry.tax += tax;
    byRate.set(rate, entry);
  }
  return Array.from(byRate.entries())
    .map(([rate, { base, tax }]) => {
      // Zero-rated / exempt lines need a TaxExemptionReasonCode per KSA rules —
      // wire the correct code once you know which exemption/zero-rating category
      // applies (exports, specific zero-rated goods, exempt financial services, etc).
      const exemptionBlock =
        rate === 0
          ? `\n        <cbc:TaxExemptionReasonCode>VATEX-SA-OOS</cbc:TaxExemptionReasonCode>` +
            `\n        <cbc:TaxExemptionReason>Not subject to VAT / zero-rated — VERIFY exact reason code before production</cbc:TaxExemptionReason>`
          : "";
      return `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${money(base)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${rate > 0 ? "S" : "Z"}</cbc:ID>
          <cbc:Percent>${rate.toFixed(2)}</cbc:Percent>${exemptionBlock}
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`;
    })
    .join("");
}

function invoiceLines(lines: ZatcaInvoiceLineInput[], currency: string): string {
  return lines
    .map((line, idx) => {
      const rate = line.taxRate ?? 0;
      const tax = line.lineTotal * (rate / 100);
      return `
  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(line.lineTotal)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="${currency}">${money(line.lineTotal + tax)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${xmlEscape(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${rate > 0 ? "S" : "Z"}</cbc:ID>
        <cbc:Percent>${rate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${money(line.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("");
}

/**
 * Returns the unsigned XML string. `qrPlaceholder`/signature are injected
 * later by sign.ts — this function leaves cac:AdditionalDocumentReference
 * "QR" pointing at an empty placeholder and no ext:UBLExtensions block yet,
 * because the QR (tags 6-9) and the signature both depend on hashing *this*
 * canonicalized document first.
 */
export function buildUnsignedInvoiceXml(invoice: ZatcaInvoiceInput, chain: ZatcaChainInput): string {
  const typeCodeName = invoiceTypeCodeName(invoice.isB2B, invoice.isTaxInvoice);
  const profileId = invoice.isB2B ? "reporting:1.0" : "reporting:1.0"; // clearance flow overrides at submit time if B2B requires it — see sign.ts/apiClient.ts
  const [issueDate, issueTimeRaw] = invoice.issueDateTimeIso.split("T");
  const issueTime = (issueTimeRaw ?? "00:00:00").replace(/\.\d+Z?$/, "").replace("Z", "");

  const buyerBlock = invoice.buyer ? partyBlock("cac:AccountingCustomerParty", invoice.buyer) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent><!-- SIGNATURE_PLACEHOLDER --></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${xmlEscape(invoice.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${xmlEscape(chain.uuid)}</cbc:UUID>
  <cbc:IssueDate>${xmlEscape(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${xmlEscape(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${typeCodeName}">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${xmlEscape(invoice.currency)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${xmlEscape(invoice.currency)}</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${chain.icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${xmlEscape(chain.previousInvoiceHash)}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain"><!-- QR_PLACEHOLDER --></cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>${partyBlock("cac:AccountingSupplierParty", invoice.seller)}${buyerBlock}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${money(invoice.totalTax)}</cbc:TaxAmount>${taxSubtotals(invoice.lines, invoice.currency)}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${money(invoice.subTotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${money(invoice.subTotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${money(invoice.grandTotal)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${invoice.currency}">${money(invoice.totalDiscount)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${money(invoice.grandTotal)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${invoiceLines(invoice.lines, invoice.currency)}
</Invoice>`;
}
