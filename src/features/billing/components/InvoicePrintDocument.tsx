import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import type { Invoice } from "../schemas/invoice";
import type { BillingSettings } from "../schemas/settings";
import type { Contact } from "@/features/crm/types/contacts.types";
import type { CompanyProfile } from "@/features/companies/types/company.types";
import { resolveInvoiceCustomerName } from "../utils/invoice-customer";
import { canShowZatcaQr, generateZatcaQr, normalizeZatcaVat } from "../utils/zatca";
import { ZatcaQrCode } from "./ZatcaQrCode";
import { billingDateLocale } from "../utils/locale";
import { INVOICE_LOGO, INVOICE_THEME, INVOICE_FONT } from "../constants/invoice-theme";
import {
  invoiceLineBeforeTax,
  invoiceLineVat,
  invoiceVatPercent,
} from "../utils/invoice-line-utils";
import {
  resolveZatcaInvoiceKind,
  zatcaInvoiceTitleKey,
} from "../utils/invoice-type";

interface InvoicePrintDocumentProps {
  invoice: Invoice;
  settings?: BillingSettings;
  company?: CompanyProfile | null;
  customer?: Contact;
  amountDue: number;
  /** When set, QR encodes this https URL so camera scan opens the PDF */
  pdfShareUrl?: string | null;
}

function MetaCell({
  label,
  value,
  align,
  numeric = false,
}: {
  label: string;
  value: ReactNode;
  align: "start" | "center" | "end";
  numeric?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: align,
        flex: 1,
        minWidth: 0,
        padding: "6px 4px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: INVOICE_THEME.label,
          marginBottom: "4px",
          lineHeight: 1.35,
          letterSpacing: "normal",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: INVOICE_THEME.text,
          lineHeight: 1.35,
          letterSpacing: "normal",
          display: "flex",
          justifyContent:
            align === "center"
              ? "center"
              : align === "end"
                ? "flex-end"
                : "flex-start",
          ...(numeric
            ? { direction: "ltr" as const, unicodeBidi: "isolate" as const }
            : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PartyBox({
  title,
  name,
  phone,
  email,
  cr,
  vat,
  address,
  align,
  crLabel,
  vatLabel,
}: {
  title: string;
  name: string;
  phone?: string;
  email?: string;
  cr?: string;
  vat?: string;
  address?: string;
  align: "start" | "end";
  crLabel: string;
  vatLabel: string;
}) {
  const textAlign = align === "start" ? "left" : "right";

  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${INVOICE_THEME.border}`,
        borderRadius: "8px",
        padding: "14px 16px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: INVOICE_THEME.primary,
          lineHeight: 1.4,
          letterSpacing: "normal",
          textAlign,
        }}
      >
        {title}
      </div>
      <div
        style={{
          borderBottom: `1px solid ${INVOICE_THEME.borderLight}`,
          margin: "6px 0 10px",
        }}
      />
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: INVOICE_THEME.primaryDark,
          marginBottom: "6px",
          textAlign,
        }}
      >
        {name}
      </div>
      {phone ? (
        <div style={{ fontSize: "10px", color: INVOICE_THEME.text, textAlign }} dir="ltr">
          {phone}
        </div>
      ) : null}
      {email ? (
        <div style={{ fontSize: "10px", color: INVOICE_THEME.text, textAlign }} dir="ltr">
          {email}
        </div>
      ) : null}
      {cr ? (
        <div style={{ fontSize: "10px", color: INVOICE_THEME.muted, marginTop: "6px", textAlign }}>
          {crLabel}: <span dir="ltr">{cr}</span>
        </div>
      ) : null}
      {vat ? (
        <div style={{ fontSize: "10px", color: INVOICE_THEME.muted, textAlign }}>
          {vatLabel}: <span dir="ltr">{vat}</span>
        </div>
      ) : null}
      {address ? (
        <div
          style={{
            fontSize: "10px",
            color: INVOICE_THEME.text,
            marginTop: "6px",
            whiteSpace: "pre-line",
            textAlign,
          }}
        >
          {address}
        </div>
      ) : null}
    </div>
  );
}

function PlaceholderBox({
  label,
  size = 88,
}: {
  label: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `1px solid ${INVOICE_THEME.borderLight}`,
        borderRadius: "6px",
        background: INVOICE_THEME.placeholderBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 600,
        color: INVOICE_THEME.muted,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

export function InvoicePrintDocument({
  invoice,
  settings,
  company,
  customer,
  amountDue,
  pdfShareUrl,
}: InvoicePrintDocumentProps) {
  const { t, i18n } = useTranslation("billing");
  const isAr = i18n.language.startsWith("ar");
  const dir = isAr ? "rtl" : "ltr";
  const dateLocale = billingDateLocale(i18n.language);
  const align = isAr ? "right" : "left";

  const profile = settings?.companyProfile;
  const companyName = profile?.name || company?.legalName || company?.name || "—";
  const companyAddress = profile?.address || company?.address;
  const companyCr =
    profile?.commercialRegister?.trim() ||
    company?.commercialRegister?.trim() ||
    undefined;
  const companyVatRaw = profile?.taxNumber || company?.taxNumber;
  const companyVat = companyVatRaw ? normalizeZatcaVat(companyVatRaw) || companyVatRaw.trim() : undefined;
  const companyPhone = profile?.phone || company?.phone;
  const logoSrc = profile?.logoUrl?.trim() || INVOICE_LOGO;

  const customerName = resolveInvoiceCustomerName(
    invoice,
    customer ? [customer] : [],
    t("invoices.detail.unknown_customer")
  );

  const invoiceKind = resolveZatcaInvoiceKind(invoice, customer);
  const documentTitle = t(zatcaInvoiceTitleKey(invoiceKind));

  const shareUrl = pdfShareUrl?.trim() || "";
  // Phase 2 QR (tags 1-9, includes the cryptographic stamp) once the invoice
  // has been cleared/reported via zatcaSubmitInvoice; otherwise fall back to
  // the Phase 1 QR (tags 1-5) computed locally.
  const zatcaQrPhase1 =
    canShowZatcaQr(companyVatRaw)
      ? generateZatcaQr(
          companyName === "—" ? "Seller" : companyName,
          companyVatRaw!,
          invoice.issueDate,
          invoice.grandTotal,
          invoice.totalTax
        )
      : "";
  const zatcaQr = invoice.zatcaQrPhase2 || zatcaQrPhase1;
  // A ZATCA-compliant tax invoice MUST show the TLV QR, not a generic link —
  // reader apps decode seller/VAT/totals (and, once submitted, the
  // cryptographic stamp) from it; a URL QR isn't machine-readable by them.
  // Only fall back to a "scan to view PDF" link-QR when there's no VAT
  // number to build a compliant QR from at all.
  const qrValue = zatcaQr || shareUrl;
  const showQr = !!qrValue;
  const qrOpensPdf = !zatcaQr && !!shareUrl;
  const vatPercent = invoiceVatPercent(invoice.subTotal, invoice.totalTax);
  const issueDateTime = invoice.issueDate.toLocaleString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cellBorder = `1px solid ${INVOICE_THEME.borderLight}`;
  const thStyle: React.CSSProperties = {
    border: cellBorder,
    padding: "7px 4px",
    background: INVOICE_THEME.headerBg,
    color: INVOICE_THEME.primaryDark,
    fontWeight: 700,
    fontSize: "9px",
    textAlign: "center",
  };
  const tdStyle: React.CSSProperties = {
    border: cellBorder,
    padding: "7px 4px",
    fontSize: "10px",
    verticalAlign: "middle",
    background: "#fff",
  };

  const notesText = [invoice.notes, invoice.termsAndConditions]
    .filter(Boolean)
    .join("\n\n");

  const moneyLocale = isAr ? "ar-SA" : "en-US";
  const moneyDir = isAr ? "rtl" : "ltr";

  function PrintMoney({ amount, size = 10 }: { amount: number; size?: number }) {
    return (
      <MoneyAmount
        amount={amount}
        currency={invoice.currency}
        locale={moneyLocale}
        priceDirection={moneyDir}
        symbolSize={size}
        maximumFractionDigits={2}
      />
    );
  }

  function MoneyCell({ amount, bold = false }: { amount: number; bold?: boolean }) {
    return (
      <td
        style={{
          ...tdStyle,
          textAlign: "center",
          ...(bold ? { fontWeight: 600 } : {}),
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PrintMoney amount={amount} />
        </div>
      </td>
    );
  }

  return (
    <div
      data-invoice-print
      dir={dir}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm 12mm",
        background: "#fff",
        color: INVOICE_THEME.text,
        fontFamily: INVOICE_FONT,
        fontSize: "11px",
        lineHeight: 1.5,
        letterSpacing: "normal",
        boxSizing: "border-box",
      }}
    >
      {/* Header: Logo | Title + meta | QR */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "14px",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <img
            src={logoSrc}
            alt={companyName}
            crossOrigin="anonymous"
            style={{
              height: 88,
              width: "auto",
              maxWidth: 120,
              objectFit: "contain",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: "0 0 12px",
              textAlign: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: INVOICE_THEME.primary,
              lineHeight: 1.4,
              letterSpacing: "normal",
            }}
          >
            {documentTitle}
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <MetaCell
              label={t("invoices.detail.invoice_no")}
              value={invoice.invoiceNumber}
              align="center"
              numeric
            />
            <MetaCell
              label={t("invoices.detail.issue_datetime")}
              value={issueDateTime}
              align="center"
              numeric
            />
            <MetaCell
              label={t("invoices.detail.due_date")}
              value={invoice.dueDate.toLocaleDateString(dateLocale)}
              align="center"
              numeric
            />
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: "center" }}>
          {showQr ? (
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  padding: "4px",
                  border: `1px solid ${INVOICE_THEME.borderLight}`,
                  borderRadius: "6px",
                  background: "#fff",
                }}
              >
                <ZatcaQrCode value={qrValue} size={120} />
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  color: INVOICE_THEME.muted,
                  maxWidth: 130,
                  lineHeight: 1.35,
                  letterSpacing: "normal",
                }}
              >
                {t(
                  qrOpensPdf
                    ? "invoices.detail.qr_hint_pdf"
                    : "invoices.detail.qr_hint"
                )}
              </div>
            </div>
          ) : (
            <PlaceholderBox label={t("invoices.detail.qr")} size={120} />
          )}
        </div>
      </div>

      <div
        style={{
          height: "6px",
          background: INVOICE_THEME.gradientBar,
          borderRadius: "2px",
          marginBottom: "14px",
        }}
      />

      {/* Seller | Buyer */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "14px",
          flexDirection: isAr ? "row-reverse" : "row",
        }}
      >
        <PartyBox
          title={t("invoices.detail.seller")}
          name={companyName}
          phone={companyPhone}
          email={profile?.email}
          cr={companyCr}
          vat={companyVat}
          address={companyAddress}
          align={isAr ? "end" : "start"}
          crLabel={t("invoices.detail.commercial_register")}
          vatLabel={t("invoices.detail.vat_number")}
        />
        <PartyBox
          title={t("invoices.detail.buyer")}
          name={customerName}
          phone={customer?.phone}
          email={customer?.email}
          cr={customer?.commercialRegister}
          vat={customer?.taxNumber}
          address={customer?.billingAddress}
          align={isAr ? "end" : "start"}
          crLabel={t("invoices.detail.commercial_register")}
          vatLabel={t("invoices.detail.vat_number")}
        />
      </div>

      {/* Line items — ZATCA columns */}
      <table
        dir={dir}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "12px",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: "26%", textAlign: align }}>
              {t("invoices.detail.item_description")}
            </th>
            <th style={{ ...thStyle, width: "10%" }}>
              {t("invoices.detail.unit_price")}
            </th>
            <th style={{ ...thStyle, width: "8%" }}>{t("invoices.detail.qty")}</th>
            <th style={{ ...thStyle, width: "14%" }}>
              {t("invoices.detail.line_excl_vat")}
            </th>
            <th style={{ ...thStyle, width: "10%" }}>
              {t("invoices.detail.line_vat_rate")}
            </th>
            <th style={{ ...thStyle, width: "14%" }}>{t("invoices.detail.line_vat")}</th>
            <th style={{ ...thStyle, width: "14%" }}>
              {t("invoices.detail.line_incl_vat")}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => {
            const excl = invoiceLineBeforeTax(item);
            const vat = invoiceLineVat(item);
            const incl = excl + vat;
            return (
              <tr key={item.id ?? idx}>
                <td style={{ ...tdStyle, textAlign: align }}>
                  <div style={{ fontWeight: 600 }}>{item.description}</div>
                  {item.discount > 0 && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: INVOICE_THEME.accent,
                        marginTop: "2px",
                      }}
                    >
                      {t("invoices.detail.line_discount")}:{" "}
                      <PrintMoney amount={item.discount} size={9} />
                    </div>
                  )}
                </td>
                <MoneyCell amount={item.unitPrice} />
                <td style={{ ...tdStyle, textAlign: "center" }} dir="ltr">
                  {item.quantity}
                </td>
                <MoneyCell amount={excl} />
                <td style={{ ...tdStyle, textAlign: "center" }} dir="ltr">
                  {item.taxRate > 0 ? `${item.taxRate}%` : "—"}
                </td>
                {item.taxRate > 0 ? (
                  <MoneyCell amount={vat} />
                ) : (
                  <td style={{ ...tdStyle, textAlign: "center" }}>—</td>
                )}
                <MoneyCell amount={incl} bold />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals + status */}
      <div
        style={{
          display: "flex",
          justifyContent: isAr ? "flex-start" : "flex-end",
          marginBottom: "12px",
        }}
      >
        <div style={{ width: "52%", minWidth: "240px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {invoice.totalDiscount > 0 && (
                <tr>
                  <td
                    style={{
                      border: cellBorder,
                      padding: "8px 10px",
                      fontWeight: 700,
                      fontSize: "10px",
                      textAlign: align,
                      color: INVOICE_THEME.accent,
                    }}
                  >
                    {t("invoices.detail.total_discount")}
                  </td>
                  <td
                    style={{
                      border: cellBorder,
                      padding: "8px 10px",
                      textAlign: "center",
                      color: INVOICE_THEME.accent,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <PrintMoney amount={-invoice.totalDiscount} />
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td
                  style={{
                    border: cellBorder,
                    padding: "8px 10px",
                    fontWeight: 700,
                    fontSize: "10px",
                    textAlign: align,
                  }}
                >
                  {t("invoices.detail.subtotal")}
                </td>
                <td
                  style={{
                    border: cellBorder,
                    padding: "8px 10px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <PrintMoney
                      amount={Math.max(
                        0,
                        invoice.subTotal - (invoice.totalDiscount || 0)
                      )}
                    />
                  </div>
                </td>
              </tr>
              {invoice.totalTax > 0 && (
                <tr>
                  <td
                    style={{
                      border: cellBorder,
                      padding: "8px 10px",
                      fontWeight: 700,
                      fontSize: "10px",
                      textAlign: align,
                    }}
                  >
                    {t("invoices.detail.vat_percent", { rate: vatPercent })}
                  </td>
                  <td
                    style={{
                      border: cellBorder,
                      padding: "8px 10px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <PrintMoney amount={invoice.totalTax} />
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td
                  style={{
                    border: cellBorder,
                    padding: "10px",
                    fontWeight: 700,
                    fontSize: "11px",
                    background: INVOICE_THEME.totalBg,
                    color: INVOICE_THEME.totalText,
                    textAlign: align,
                    letterSpacing: "normal",
                  }}
                >
                  {t("invoices.detail.total")}
                </td>
                <td
                  style={{
                    border: cellBorder,
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "12px",
                    background: INVOICE_THEME.totalBg,
                    color: INVOICE_THEME.totalText,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <PrintMoney amount={invoice.grandTotal} size={12} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              marginTop: "8px",
              border: `1px solid ${INVOICE_THEME.borderLight}`,
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <MetaCell
              label={t("invoices.detail.payment_status")}
              value={t(`invoices.status.${invoice.status}`)}
              align="center"
            />
            <div style={{ width: 1, background: INVOICE_THEME.borderLight }} />
            <MetaCell
              label={t("invoices.detail.paid")}
              value={<PrintMoney amount={invoice.amountPaid || 0} size={12} />}
              align="center"
            />
            <div style={{ width: 1, background: INVOICE_THEME.borderLight }} />
            <MetaCell
              label={t("invoices.detail.outstanding")}
              value={<PrintMoney amount={amountDue} size={12} />}
              align="center"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      {notesText ? (
        <div
          style={{
            border: `1px solid ${INVOICE_THEME.border}`,
            borderRadius: "8px",
            padding: "12px 14px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: INVOICE_THEME.primary,
              marginBottom: "6px",
              textAlign: align,
            }}
          >
            {t("invoices.detail.notes")}:
          </div>
          <div
            style={{
              borderBottom: `1px solid ${INVOICE_THEME.borderLight}`,
              marginBottom: "8px",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              whiteSpace: "pre-wrap",
              textAlign: align,
              color: INVOICE_THEME.muted,
            }}
          >
            {notesText}
          </p>
        </div>
      ) : null}
    </div>
  );
}
