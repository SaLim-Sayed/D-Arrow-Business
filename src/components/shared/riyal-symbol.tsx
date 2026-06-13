import type { CSSProperties } from "react";
import { cn, isSarCurrency } from "@/lib/utils";

const RIYAL_SYMBOL_SRC = "/saudi-riyal-symbol.svg";

interface RiyalSymbolProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function RiyalSymbol({ size = 14, className, style }: RiyalSymbolProps) {
  return (
    <img
      src={RIYAL_SYMBOL_SRC}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("inline-block object-contain", className)}
      style={{ verticalAlign: "middle", ...style }}
      crossOrigin="anonymous"
    />
  );
}

interface MoneyAmountProps {
  amount: number;
  currency?: string | null;
  suffix?: string;
  className?: string;
  symbolSize?: number;
  locale?: string;
  /** Bidi direction for SAR amount + symbol (use rtl in Arabic PDF so the icon reads after the number) */
  priceDirection?: "ltr" | "rtl";
}

/** Amount with official Saudi Riyal icon when currency is SAR */
export function MoneyAmount({
  amount,
  currency,
  suffix,
  className,
  symbolSize = 14,
  locale = "en-US",
  priceDirection = "ltr",
}: MoneyAmountProps) {
  const formatted = amount.toLocaleString(locale, { maximumFractionDigits: 0 });

  if (isSarCurrency(currency)) {
    return (
      <span
        className={cn("tabular-nums", className)}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          direction: priceDirection,
          unicodeBidi: "isolate",
          alignItems: "center",
          gap: symbolSize <= 11 ? 3 : 5,
        }}
      >
        <span>{formatted}</span>
        <RiyalSymbol size={symbolSize} />
        {suffix ? <span>{suffix}</span> : null}
      </span>
    );
  }

  const code = (currency ?? "USD").toUpperCase();
  return (
    <span className={className} dir="ltr">
      {formatted} {code}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
