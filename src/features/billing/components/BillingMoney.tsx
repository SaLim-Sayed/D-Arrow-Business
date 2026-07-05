import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useTranslation } from "react-i18next";
import { DEFAULT_BILLING_CURRENCY } from "../utils/billing-currency";

interface BillingMoneyProps {
  amount: number;
  currency?: string | null;
  symbolSize?: number;
  maximumFractionDigits?: number;
  className?: string;
  /** Override locale detection (e.g. print document) */
  locale?: string;
  priceDirection?: "ltr" | "rtl";
}

export function BillingMoney({
  amount,
  currency,
  symbolSize = 14,
  maximumFractionDigits = 2,
  className,
  locale,
  priceDirection,
}: BillingMoneyProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");

  return (
    <MoneyAmount
      amount={amount}
      currency={currency ?? DEFAULT_BILLING_CURRENCY}
      locale={locale ?? (isAr ? "ar-SA" : "en-US")}
      priceDirection={priceDirection ?? (isAr ? "rtl" : "ltr")}
      symbolSize={symbolSize}
      maximumFractionDigits={maximumFractionDigits}
      className={className}
    />
  );
}
