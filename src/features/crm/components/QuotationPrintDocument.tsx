import type { QuotationData, QuotationLineItem } from "../types/quotation.types";
import { QUOTATION_THEME } from "../constants/quotation-theme";
import { calculateQuotationTotals } from "../utils/quotation-calculations";
import { itemServiceName, itemDescription, useQuotationLayout } from "../utils/quotation-direction";
import { recipientTitleLabel } from "../utils/quotation-recipient-title";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import {
  QuotationLetterheadHeader,
  QuotationLetterheadFooter,
  QuotationWatermark,
} from "./QuotationLetterhead";

interface QuotationPrintDocumentProps {
  data: QuotationData;
}

const cellBorder = `1px solid ${QUOTATION_THEME.tableBorder}`;

function PriceCell({
  amount,
  currency,
  priceDirection,
}: {
  amount: number;
  currency: string;
  priceDirection: "ltr" | "rtl";
}) {
  if (amount <= 0) {
    return (
      <span style={{ color: "#9ca3af", fontSize: "11px" }}>—</span>
    );
  }

  const numberLocale = "en-US";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        minWidth: "64px",
        width: "100%",
        unicodeBidi: "isolate",
      }}
    >
      <MoneyAmount
        amount={amount}
        currency={currency}
        symbolSize={12}
        locale={numberLocale}
        priceDirection={priceDirection}
      />
    </div>
  );
}

function DescriptionCell({
  item,
  bulletPad,
  locale,
}: {
  item: QuotationLineItem;
  bulletPad: { paddingRight: string | number; paddingLeft: string | number };
  locale: "ar" | "en";
}) {
  const mainText = itemDescription(item, locale);
  const hasBullets = !!item.descriptionLines?.length;

  if (!mainText && !hasBullets) {
    return (
      <span style={{ color: "#9ca3af", fontSize: "9.5px" }}>—</span>
    );
  }

  const textStyle = {
    fontSize: "9.5px",
    direction: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
    textAlign: locale === "ar" ? ("right" as const) : ("left" as const),
    lineHeight: 1.45,
  };

  return (
    <div>
      {mainText ? (
        <p style={{ ...textStyle, marginBottom: hasBullets ? "6px" : 0 }}>
          {mainText}
        </p>
      ) : null}
      {hasBullets ? (
        <ul
          style={{
            margin: 0,
            ...bulletPad,
            listStyleType: "disc",
            ...textStyle,
          }}
        >
          {item.descriptionLines!.map((line, i) => (
            <li key={i} style={{ marginBottom: "2px" }}>
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function QuotationPrintDocument({ data }: QuotationPrintDocumentProps) {
  const { locale, isAr, dir, align, bulletPad, tPdf } = useQuotationLayout();
  const totals = calculateQuotationTotals(data);
  const { client } = data;
  const priceDirection = isAr ? "rtl" : "ltr";

  const validityNote = tPdf("validityNote", {
    months: data.validityMonths,
    unit: data.validityMonths === 1 ? tPdf("month") : tPdf("months"),
  });
  const notesText = data.notes?.trim() || validityNote;

  const thStyle = {
    border: cellBorder,
    padding: "8px 6px",
    background: QUOTATION_THEME.tableHeaderBg,
    color: QUOTATION_THEME.tableHeaderText,
    fontWeight: 700,
    textAlign: "center" as const,
    fontSize: "11px",
  };

  const tdStyle = {
    border: cellBorder,
    padding: "7px 8px",
    verticalAlign: "top" as const,
    background: "#fff",
    fontSize: "10px",
  };

  const columns = [
    { key: "service", label: tPdf("colService"), width: "28%" },
    { key: "qty", label: tPdf("colQty"), width: "8%" },
    { key: "desc", label: tPdf("colDescription"), width: "40%" },
    { key: "price", label: tPdf("colPrice"), width: "24%" },
  ];

  const priceCellStyle = {
    ...tdStyle,
    textAlign: "center" as const,
    fontWeight: 600,
    verticalAlign: "middle" as const,
    whiteSpace: "nowrap" as const,
    padding: "8px 6px",
  };

  return (
    <div
      dir={dir}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "8mm 12mm 6mm",
        background: "#fff",
        color: "#111",
        fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif",
        fontSize: "11px",
        lineHeight: 1.5,
        direction: dir,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <QuotationLetterheadHeader
        company={data.company}
        locale={locale}
        labels={{
          cr: tPdf("cr"),
          vat: tPdf("vat"),
          crShort: tPdf("crShort"),
          phone: tPdf("phone"),
          email: tPdf("email"),
          address: tPdf("address"),
          companyShort: tPdf("companyShort"),
        }}
      />

      <div style={{ position: "relative", flex: 1, zIndex: 1 }}>
        <QuotationWatermark />

        <h1
          style={{
            margin: "10px 0 12px",
            textAlign: "center",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "1px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {tPdf("title")}
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "11px",
            position: "relative",
            zIndex: 1,
            direction: dir,
          }}
        >
          <span>
            <strong>{tPdf("date")}:</strong> {data.quoteDate}
            {isAr ? ` ${tPdf("dateSuffix")}` : ""}
          </span>
          <span>
            <strong>{tPdf("quoteNumber")}:</strong> {data.quoteNumber}
          </span>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginBottom: "10px" }}>
          <div
            style={{
              textAlign: align,
              fontSize: "11px",
              marginBottom: "4px",
              direction: dir,
            }}
          >
            {recipientTitleLabel(client.recipientTitle, tPdf)} {client.name}
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            color: QUOTATION_THEME.accentRed,
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 0 6px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {tPdf("details")}
        </p>

        <table
          dir={dir}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            position: "relative",
            zIndex: 1,
            marginBottom: "14px",
            direction: dir,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ ...thStyle, width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 500,
                    textAlign: align,
                    direction: dir,
                  }}
                >
                  {itemServiceName(item, locale)}
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {item.quantity > 0 ? item.quantity : ""}
                </td>
                <td style={tdStyle}>
                  <DescriptionCell
                    item={item}
                    bulletPad={bulletPad}
                    locale={locale}
                  />
                </td>
                <td style={priceCellStyle}>
                  <PriceCell
                    amount={item.unitPrice * item.quantity}
                    currency={data.currency}
                    priceDirection={priceDirection}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={3}
                style={{
                  border: cellBorder,
                  padding: "9px 10px",
                  background: QUOTATION_THEME.totalRowBg,
                  fontWeight: 700,
                  fontSize: "12px",
                  textAlign: align,
                  direction: dir,
                }}
              >
                {tPdf("total")}
              </td>
              <td
                style={{
                  border: cellBorder,
                  padding: "9px 6px",
                  background: QUOTATION_THEME.totalRowBg,
                  fontWeight: 700,
                  fontSize: "11px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    whiteSpace: "nowrap",
                    unicodeBidi: "isolate",
                  }}
                >
                  <MoneyAmount
                    amount={totals.total}
                    currency={data.currency}
                    symbolSize={13}
                    locale="en-US"
                    priceDirection={priceDirection}
                  />
                  {data.pricesIncludeVat ? (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "#444",
                        direction: locale === "ar" ? "rtl" : "ltr",
                        unicodeBidi: "isolate",
                      }}
                    >
                      {tPdf("includingVat")}
                    </span>
                  ) : null}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "8px",
            direction: dir,
            textAlign: align,
          }}
        >
          <p
            style={{
              color: QUOTATION_THEME.accentRed,
              fontWeight: 700,
              fontSize: "12px",
              margin: "0 0 6px",
              textAlign: align,
            }}
          >
            {tPdf("notes")}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              lineHeight: 1.5,
              direction: dir,
              textAlign: align,
              whiteSpace: "pre-wrap",
            }}
          >
            {notesText}
          </p>
        </div>
      </div>

      <QuotationLetterheadFooter
        company={data.company}
        locale={locale}
        labels={{
          cr: tPdf("cr"),
          vat: tPdf("vat"),
          crShort: tPdf("crShort"),
          phone: tPdf("phone"),
          email: tPdf("email"),
          address: tPdf("address"),
          companyShort: tPdf("companyShort"),
        }}
      />
    </div>
  );
}
