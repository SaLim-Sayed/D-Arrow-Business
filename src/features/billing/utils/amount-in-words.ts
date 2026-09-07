/** Amount in words for receipt/payment vouchers (SAR-oriented). */

const AR_ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];

const AR_TENS = [
  "",
  "عشرة",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];

const AR_HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

const EN_ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const EN_TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function joinAr(parts: string[]) {
  return parts.filter(Boolean).join(" و");
}

function underThousandAr(n: number): string {
  if (n <= 0) return "";
  if (n < 20) return AR_ONES[n];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(AR_HUNDREDS[hundreds]);
  if (rest) {
    if (rest < 20) parts.push(AR_ONES[rest]);
    else {
      const ones = rest % 10;
      const tens = Math.floor(rest / 10);
      if (ones) parts.push(AR_ONES[ones], AR_TENS[tens]);
      else parts.push(AR_TENS[tens]);
    }
  }
  return joinAr(parts);
}

function integerToArabic(n: number): string {
  if (n === 0) return "صفر";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];

  if (millions === 1) parts.push("مليون");
  else if (millions === 2) parts.push("مليونان");
  else if (millions > 2) parts.push(`${underThousandAr(millions)} مليون`);

  if (thousands === 1) parts.push("ألف");
  else if (thousands === 2) parts.push("ألفان");
  else if (thousands > 2) parts.push(`${underThousandAr(thousands)} ألف`);

  if (rest) parts.push(underThousandAr(rest));
  return joinAr(parts);
}

function underThousandEn(n: number): string {
  if (n <= 0) return "";
  if (n < 20) return EN_ONES[n];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${EN_ONES[hundreds]} hundred`);
  if (rest) {
    if (rest < 20) parts.push(EN_ONES[rest]);
    else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      parts.push(ones ? `${EN_TENS[tens]}-${EN_ONES[ones]}` : EN_TENS[tens]);
    }
  }
  return parts.join(" ");
}

function integerToEnglish(n: number): string {
  if (n === 0) return "zero";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(`${underThousandEn(millions)} million`);
  if (thousands) parts.push(`${underThousandEn(thousands)} thousand`);
  if (rest) parts.push(underThousandEn(rest));
  return parts.join(" ");
}

function splitAmount(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  const major = Math.floor(rounded + 1e-9);
  const minor = Math.round((rounded - major) * 100);
  return { major, minor };
}

const AR_CURRENCY_UNITS: Record<string, { major: string; minor: string }> = {
  SAR: { major: "ريال", minor: "هللة" },
  SR: { major: "ريال", minor: "هللة" },
  "﷼": { major: "ريال", minor: "هللة" },
  USD: { major: "دولار", minor: "سنت" },
  EUR: { major: "يورو", minor: "سنت" },
  AED: { major: "درهم", minor: "فلس" },
  EGP: { major: "جنيه", minor: "قرش" },
  KWD: { major: "دينار", minor: "فلس" },
  QAR: { major: "ريال", minor: "درهم" },
  BHD: { major: "دينار", minor: "فلس" },
  OMR: { major: "ريال", minor: "بيسة" },
  GBP: { major: "جنيه إسترليني", minor: "بنس" },
};

const EN_CURRENCY_UNITS: Record<
  string,
  { majorSingular: string; majorPlural: string; minor: string }
> = {
  SAR: { majorSingular: "Saudi Riyal", majorPlural: "Saudi Riyals", minor: "Halala" },
  SR: { majorSingular: "Saudi Riyal", majorPlural: "Saudi Riyals", minor: "Halala" },
  "﷼": { majorSingular: "Saudi Riyal", majorPlural: "Saudi Riyals", minor: "Halala" },
  USD: { majorSingular: "US Dollar", majorPlural: "US Dollars", minor: "Cents" },
  EUR: { majorSingular: "Euro", majorPlural: "Euros", minor: "Cents" },
  AED: { majorSingular: "UAE Dirham", majorPlural: "UAE Dirhams", minor: "Fils" },
  EGP: { majorSingular: "Egyptian Pound", majorPlural: "Egyptian Pounds", minor: "Piastres" },
  GBP: { majorSingular: "Pound Sterling", majorPlural: "Pounds Sterling", minor: "Pence" },
};

export function amountInWords(
  amount: number,
  options?: { locale?: string; currency?: string }
): string {
  const isAr = (options?.locale ?? "ar").startsWith("ar");
  const { major, minor } = splitAmount(amount);
  const currency = (options?.currency ?? "SAR").toUpperCase();

  if (isAr) {
    const arUnits = AR_CURRENCY_UNITS[currency] ?? {
      major: currency,
      minor: "جزءاً من مائة",
    };
    const majorWords = integerToArabic(major);
    const unit = arUnits.major;
    if (minor <= 0) return `${majorWords} ${unit} فقط لا غير`;
    const minorWords = integerToArabic(minor);
    const fraction = arUnits.minor;
    return `${majorWords} ${unit} و${minorWords} ${fraction} فقط لا غير`;
  }

  const enUnits = EN_CURRENCY_UNITS[currency];
  const majorWords = integerToEnglish(major);
  const unit = enUnits
    ? major === 1
      ? enUnits.majorSingular
      : enUnits.majorPlural
    : currency;

  if (minor <= 0) return `${majorWords} ${unit} only`;
  return `${majorWords} ${unit} and ${minor}/100 only`;
}

