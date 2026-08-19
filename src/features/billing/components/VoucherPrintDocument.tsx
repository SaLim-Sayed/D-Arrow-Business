import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import type { Voucher } from "../schemas/voucher";
import type { BillingSettings } from "../schemas/settings";
import type { CompanyProfile } from "@/features/companies/types/company.types";
import { INVOICE_FONT, INVOICE_LOGO, INVOICE_THEME } from "../constants/invoice-theme";
import { billingDateLocale } from "../utils/locale";
import { amountInWords } from "../utils/amount-in-words";
import { DEFAULT_BILLING_CURRENCY } from "../utils/billing-currency";

interface VoucherPrintDocumentProps {
  voucher: Voucher;
  settings?: BillingSettings;
  company?: CompanyProfile | null;
}

export function VoucherPrintDocument({
  voucher,
  settings,
  company,
}: VoucherPrintDocumentProps) {
  const { t, i18n } = useTranslation("billing");
  const isAr = i18n.language.startsWith("ar");
  const dir = isAr ? "rtl" : "ltr";
  const dateLocale = billingDateLocale(i18n.language);
  const isReceipt = voucher.voucherType === "receipt";
  const typeKey = isReceipt ? "receipt" : "disbursement";

  const profile = settings?.companyProfile;
  const companyName = profile?.name || company?.legalName || company?.name || "—";
  const companyAddress = profile?.address || company?.address;
  const companyCr =
    profile?.commercialRegister?.trim() ||
    company?.commercialRegister?.trim() ||
    undefined;
  const companyVat = profile?.taxNumber || company?.taxNumber;
  const companyPhone = profile?.phone || company?.phone;
  const logoSrc = profile?.logoUrl?.trim() || INVOICE_LOGO;
  const words = amountInWords(voucher.amount, {
    locale: i18n.language,
    currency: voucher.currency || DEFAULT_BILLING_CURRENCY,
  });

  const cell: CSSProperties = {
    border: `1px solid ${INVOICE_THEME.borderLight}`,
    padding: "10px 12px",
    fontSize: "12px",
  };

  return (
    <div
      dir={dir}
      style={{
        width: "190mm",
        margin: "0 auto",
        background: "#fff",
        color: INVOICE_THEME.text,
        fontFamily: INVOICE_FONT,
        padding: "12mm 10mm",
      }}
    >
      <div
        style={{
          height: "4px",
          background: INVOICE_THEME.gradientBar,
          borderRadius: "4px",
          marginBottom: "16px",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={logoSrc}
            alt=""
            style={{ height: "52px", width: "auto", objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{companyName}</div>
            {companyAddress ? (
              <div style={{ fontSize: "11px", color: INVOICE_THEME.muted }}>
                {companyAddress}
              </div>
            ) : null}
            <div style={{ fontSize: "11px", color: INVOICE_THEME.muted }}>
              {[
                companyCr && `${t("vouchers.print.cr")}: ${companyCr}`,
                companyVat && `${t("vouchers.print.vat")}: ${companyVat}`,
                companyPhone,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          </div>
        </div>
        <div style={{ textAlign: isAr ? "left" : "right" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: isReceipt ? INVOICE_THEME.primaryDark : "#B42318",
            }}
          >
            {t(`vouchers.${typeKey}.print_title`)}
          </div>
          <div
            dir="ltr"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginTop: "4px",
              unicodeBidi: "isolate",
            }}
          >
            {voucher.voucherNumber}
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px" }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: "28%", background: INVOICE_THEME.headerBg, fontWeight: 700 }}>
              {t("vouchers.print.date")}
            </td>
            <td style={cell}>
              {voucher.date.toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </td>
            <td style={{ ...cell, width: "22%", background: INVOICE_THEME.headerBg, fontWeight: 700 }}>
              {t("vouchers.print.method")}
            </td>
            <td style={cell}>{voucher.methodName || "—"}</td>
          </tr>
          <tr>
            <td style={{ ...cell, background: INVOICE_THEME.headerBg, fontWeight: 700 }}>
              {t(`vouchers.${typeKey}.party`)}
            </td>
            <td style={cell} colSpan={3}>
              {voucher.partyName}
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, background: INVOICE_THEME.headerBg, fontWeight: 700 }}>
              {t(`vouchers.${typeKey}.against`)}
            </td>
            <td style={cell} colSpan={3} dir="ltr">
              {voucher.invoiceNumber || voucher.billNumber || "—"}
            </td>
          </tr>
          {voucher.reference ? (
            <tr>
              <td style={{ ...cell, background: INVOICE_THEME.headerBg, fontWeight: 700 }}>
                {t("vouchers.print.reference")}
              </td>
              <td style={cell} colSpan={3}>
                {voucher.reference}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            flex: 1,
            border: `1px solid ${INVOICE_THEME.border}`,
            borderRadius: "8px",
            padding: "12px 14px",
            background: INVOICE_THEME.placeholderBg,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: INVOICE_THEME.label,
              marginBottom: "6px",
            }}
          >
            {t("vouchers.print.amount_in_words")}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.6 }}>
            {words}
          </div>
        </div>
        <div
          style={{
            minWidth: "150px",
            borderRadius: "8px",
            padding: "12px 14px",
            background: isReceipt
              ? INVOICE_THEME.totalBg
              : "linear-gradient(90deg, #B42318 0%, #7A271A 100%)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "10px", fontWeight: 700, opacity: 0.9 }}>
            {t("vouchers.print.amount")}
          </div>
          <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 800 }}>
            <MoneyAmount
              amount={voucher.amount}
              currency={voucher.currency || DEFAULT_BILLING_CURRENCY}
              locale={isAr ? "ar-SA" : "en-US"}
              priceDirection={isAr ? "rtl" : "ltr"}
              symbolSize={16}
              className="font-bold text-white"
            />
          </div>
        </div>
      </div>

      {voucher.notes ? (
        <div style={{ ...cell, marginBottom: "18px", borderRadius: "8px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: INVOICE_THEME.label,
              marginBottom: "4px",
            }}
          >
            {t("vouchers.print.notes")}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>{voucher.notes}</div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          marginTop: "28px",
        }}
      >
        {(
          [
            "accountant",
            isReceipt ? "received" : "paid",
            "manager",
          ] as const
        ).map((key) => (
          <div
            key={key}
            style={{
              flex: 1,
              textAlign: "center",
              borderTop: `1px solid ${INVOICE_THEME.border}`,
              paddingTop: "8px",
              fontSize: "11px",
              fontWeight: 700,
              color: INVOICE_THEME.muted,
            }}
          >
            {t(`vouchers.print.signatures.${key}`)}
          </div>
        ))}
      </div>
    </div>
  );
}
