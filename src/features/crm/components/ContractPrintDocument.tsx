import type { ReactNode } from "react";
import type { ContractCompanyInfo, ContractFormDraft } from "../types/contract.types";
import {
  QuotationLetterheadFooter,
  QuotationLetterheadHeader,
  QuotationWatermark,
} from "./QuotationLetterhead";
import {
  contractFieldMap,
  formatContractDateAr,
  interpolateContractText,
} from "../constants/contract-templates";

/** Colors sampled from the official D-Arrow marketing services contract PDF. */
const CONTRACT_THEME = {
  section: "#0F4761", // الأطراف / تمهيد / بنود / التوقيعات
  party: "#C00000", // أولاً / ثانياً / الاسم / التاريخ
  text: "#04051E",
  muted: "#333333",
};

interface ContractPrintDocumentProps {
  form: ContractFormDraft;
  company: ContractCompanyInfo;
}

function PartyBlock({
  label,
  party,
  roleHint,
}: {
  label: string;
  roleHint: string;
  party: ContractFormDraft["provider"];
}) {
  const parts: string[] = [];
  if (party.name) parts.push(`الاسم: ${party.name}`);
  if (party.commercialRegister)
    parts.push(`السجل التجاري رقم: ${party.commercialRegister}`);
  if (party.taxNumber) parts.push(`الرقم الضريبي: ${party.taxNumber}`);
  if (party.address) parts.push(`العنوان: ${party.address}`);
  if (party.representative)
    parts.push(`ويمثلها في التوقيع السيد: ${party.representative}`);
  if (party.idNumber) parts.push(`هوية رقم: ${party.idNumber}`);
  if (party.phone) parts.push(`الهاتف: ${party.phone}`);
  if (party.email) parts.push(`البريد الإلكتروني: ${party.email}`);
  else parts.push("البريد الإلكتروني: لا يوجد");

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          color: CONTRACT_THEME.party,
          fontWeight: 700,
          fontSize: "10px",
          marginBottom: "4px",
        }}
      >
        {label} ({roleHint})
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "10px",
          lineHeight: 1.75,
          textAlign: "justify",
          color: CONTRACT_THEME.text,
        }}
      >
        {parts.join("، ")}.
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "10px",
          color: CONTRACT_THEME.muted,
        }}
      >
        (يُشار إليه فيما بعد بـ &quot;{roleHint}&quot;)
      </p>
    </div>
  );
}

function ClauseBlock({
  clause,
}: {
  clause: {
    number: number;
    title: string;
    body?: string;
    bullets: { id: string; text: string }[];
  };
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: "11px",
          marginBottom: "6px",
          color: CONTRACT_THEME.section,
        }}
      >
        {clause.number}. {clause.title}
      </div>
      {clause.body ? (
        <p
          style={{
            margin: "0 0 6px",
            textAlign: "justify",
            fontSize: "10px",
            color: CONTRACT_THEME.text,
            lineHeight: 1.7,
          }}
        >
          {clause.body}
        </p>
      ) : null}
      <ul
        style={{
          margin: 0,
          paddingInlineStart: "18px",
          listStyleType: "disc",
        }}
      >
        {clause.bullets.map((b) => (
          <li
            key={b.id}
            style={{
              marginBottom: "4px",
              textAlign: "justify",
              fontSize: "10px",
              color: CONTRACT_THEME.text,
              lineHeight: 1.7,
            }}
          >
            {b.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignatureColumn({
  title,
  companyName,
  personName,
  date,
}: {
  title: string;
  companyName: string;
  personName: string;
  date: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontWeight: 700,
          color: CONTRACT_THEME.text,
          marginBottom: "18px",
          fontSize: "10px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontWeight: 600,
          marginBottom: "10px",
          fontSize: "11px",
          color: CONTRACT_THEME.text,
        }}
      >
        {companyName}
      </div>
      <div style={{ marginBottom: "8px", fontSize: "10px" }}>
        <span style={{ color: CONTRACT_THEME.party, fontWeight: 700 }}>
          الاسم:
        </span>{" "}
        <span style={{ color: CONTRACT_THEME.text }}>{personName}</span>
      </div>
      <div style={{ marginBottom: "8px", fontSize: "10px" }}>
        <span style={{ color: CONTRACT_THEME.party, fontWeight: 700 }}>
          التاريخ:
        </span>{" "}
        <span style={{ color: CONTRACT_THEME.text }}>{date}</span>
      </div>
      {/* Space reserved for handwritten signature / stamp — matches reference */}
      <div style={{ height: "72px" }} />
    </div>
  );
}

function PrintPage({
  children,
  company,
  breakAfter,
}: {
  children: ReactNode;
  company: ContractCompanyInfo;
  breakAfter?: boolean;
}) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "297mm",
        padding: "10mm 14mm 12mm",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...(breakAfter ? { pageBreakAfter: "always" as const } : {}),
      }}
    >
      <QuotationWatermark />
      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <QuotationLetterheadHeader company={company} locale="ar" />
        {children}
      </div>
      <QuotationLetterheadFooter company={company} locale="ar" />
    </section>
  );
}

export function ContractPrintDocument({
  form,
  company,
}: ContractPrintDocumentProps) {
  const values = {
    ...contractFieldMap(form.fields),
    pageCount: form.pageCount || "4",
  };

  const dateLabel = formatContractDateAr(form.contractDateIso);
  const signDate = formatContractDateAr(form.signatureDateIso);

  const interpolatedClauses = form.clauses.map((c, idx) => ({
    ...c,
    number: idx + 1,
    title: interpolateContractText(c.title, values),
    body: c.body ? interpolateContractText(c.body, values) : undefined,
    bullets: c.bullets.map((b) => ({
      ...b,
      text: interpolateContractText(b.text, values),
    })),
  }));

  const first = interpolatedClauses.slice(0, 1);
  const mid = interpolatedClauses.slice(1, 6);
  const rest = interpolatedClauses.slice(6);

  return (
    <div
      data-contract-print
      dir="rtl"
      style={{
        width: "210mm",
        background: "#fff",
        color: CONTRACT_THEME.text,
        fontFamily: 'Arial, Tahoma, "Segoe UI", sans-serif',
        fontSize: "10px",
        lineHeight: 1.7,
        letterSpacing: "normal",
      }}
    >
      <PrintPage company={company} breakAfter>
        <h1
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 700,
            margin: "10px 0 12px",
            color: "#000",
          }}
        >
          {form.title}
        </h1>

        {/* Reference PDF: التاريخ on the right, رقم العقد on the left */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            fontSize: "10px",
            fontWeight: 700,
            color: "#000",
          }}
        >
          <div>التاريخ: {dateLabel}</div>
          <div>رقم العقد: {form.contractNumber}</div>
        </div>

        <h2
          style={{
            color: CONTRACT_THEME.section,
            fontSize: "11px",
            fontWeight: 700,
            margin: "0 0 10px",
          }}
        >
          الأطراف المتعاقدة
        </h2>

        <PartyBlock
          label="أولاً: الطرف الأول"
          roleHint="مقدم الخدمة"
          party={form.provider}
        />
        <PartyBlock
          label="ثانياً: الطرف الثاني"
          roleHint="العميل"
          party={form.client}
        />

        <h2
          style={{
            color: CONTRACT_THEME.section,
            fontSize: "11px",
            fontWeight: 700,
            margin: "12px 0 8px",
            letterSpacing: "0.15em",
          }}
        >
          تمهيــــد
        </h2>
        <p
          style={{
            margin: "0 0 14px",
            textAlign: "justify",
            fontSize: "10px",
            color: CONTRACT_THEME.text,
            lineHeight: 1.7,
          }}
        >
          {interpolateContractText(form.preamble, values)}
        </p>

        {first.map((c) => (
          <ClauseBlock key={c.id} clause={c} />
        ))}
      </PrintPage>

      {mid.length > 0 && (
        <PrintPage company={company} breakAfter>
          {mid.map((c) => (
            <ClauseBlock key={c.id} clause={c} />
          ))}
        </PrintPage>
      )}

      {rest.length > 0 && (
        <PrintPage company={company} breakAfter>
          {rest.map((c) => (
            <ClauseBlock key={c.id} clause={c} />
          ))}
        </PrintPage>
      )}

      <PrintPage company={company}>
        <h2
          style={{
            textAlign: "center",
            color: CONTRACT_THEME.section,
            fontSize: "11px",
            fontWeight: 700,
            margin: "36px 0 28px",
          }}
        >
          التوقيعات
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "24px",
          }}
        >
          <SignatureColumn
            title="الطرف الأول (مقدم الخدمة)"
            companyName={form.provider.name}
            personName={form.provider.representative || "—"}
            date={signDate}
          />
          <SignatureColumn
            title="الطرف الثاني (العميل)"
            companyName={form.client.name || "—"}
            personName={form.client.representative || "—"}
            date={signDate}
          />
        </div>
      </PrintPage>
    </div>
  );
}
