import type { QuotationCompanyInfo } from "../types/quotation.types";
import { QUOTATION_LOGO, QUOTATION_THEME } from "../constants/quotation-theme";
import type { QuotationLocale } from "../utils/quotation-direction";

const GRADIENT_BAR = {
  height: "7px",
  background: QUOTATION_THEME.gradientBar,
  borderRadius: "1px",
  margin: "10px 0",
};

interface QuotationLetterheadProps {
  company: QuotationCompanyInfo;
  locale?: QuotationLocale;
  labels?: {
    cr: string;
    vat: string;
    crShort: string;
    phone: string;
    email: string;
    address: string;
    companyShort: string;
  };
}

export function QuotationLetterheadHeader({
  company,
  locale = "ar",
}: QuotationLetterheadProps) {
  const enFirst = locale === "en";

  const englishBlock = (
    <div style={{ textAlign: "left", direction: "ltr" }}>
      <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "2px" }}>
        {company.nameEn}
      </div>
      <div>C.R. No.: {company.commercialRegister}</div>
      <div>VAT No.: {company.taxNumber}</div>
      <div>{company.addressEn}</div>
    </div>
  );

  const arabicBlock = (
    <div style={{ textAlign: "right", direction: "rtl" }}>
      <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "2px" }}>
        {company.nameAr}
      </div>
      <div>السجل التجاري: {company.commercialRegister}</div>
      <div>الرقم الضريبي: {company.taxNumber}</div>
      <div>{company.addressAr}</div>
    </div>
  );

  return (
    <header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "10px",
          fontSize: "10.5px",
          lineHeight: 1.55,
          color: "#1a1a1a",
        }}
      >
        {enFirst ? englishBlock : arabicBlock}

        <img
          src={QUOTATION_LOGO}
          alt="D Arrow"
          style={{ height: "78px", objectFit: "contain" }}
          crossOrigin="anonymous"
        />

        {enFirst ? arabicBlock : englishBlock}
      </div>

      <div style={GRADIENT_BAR} />
    </header>
  );
}

export function QuotationLetterheadFooter({
  company,
  locale = "ar",
  labels,
}: QuotationLetterheadProps) {
  const isAr = locale === "ar";
  const L = labels ?? {
    cr: isAr ? "س.ت" : "C.R.",
    vat: "",
    crShort: isAr ? "س.ت" : "C.R.",
    phone: isAr ? "هاتف" : "Phone",
    email: isAr ? "البريد الإلكتروني" : "Email",
    address: isAr ? "العنوان" : "Address",
    companyShort: isAr ? "شركة دي آرو" : company.nameEn,
  };

  const district = isAr
    ? company.districtAr || company.addressAr
    : company.districtEn || company.addressEn;

  return (
    <footer style={{ marginTop: "auto" }}>
      <div style={GRADIENT_BAR} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          fontSize: "9.5px",
          color: "#333",
          paddingTop: "4px",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <div style={{ textAlign: "left", direction: "ltr", flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{company.website}</div>
          <div>
            {isAr ? (
              <>
                <span dir="rtl">{L.email}:</span> {company.email}
              </>
            ) : (
              <>
                {L.email}: {company.email}
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1, direction: "ltr" }}>
          <div>
            {L.crShort}: {company.commercialRegister}
          </div>
          <div>
            {L.phone}: {company.phone}
          </div>
        </div>

        <div
          style={{
            textAlign: isAr ? "right" : "left",
            direction: isAr ? "rtl" : "ltr",
            flex: 1,
          }}
        >
          <div style={{ fontWeight: 600 }}>{L.companyShort}</div>
          <div>
            {L.address}: {district}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function QuotationWatermark() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "48%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.09,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <img
        src={QUOTATION_LOGO}
        alt=""
        style={{ width: "320px", objectFit: "contain" }}
        crossOrigin="anonymous"
      />
    </div>
  );
}
