import type { CSSProperties } from "react";
import { cn, isSarCurrency } from "@/lib/utils";

/** Official Saudi Riyal symbol viewBox */
const RIYAL_VIEWBOX = "0 0 1124.14 1256.39";

interface RiyalSymbolProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function RiyalSymbol({ size = 14, className, style }: RiyalSymbolProps) {
  const hasCustomSize = style?.width != null || style?.height != null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={RIYAL_VIEWBOX}
      width={hasCustomSize ? undefined : size}
      height={hasCustomSize ? undefined : size}
      aria-hidden
      className={cn("shrink-0", className)}
      style={{
        display: "block",
        ...style,
      }}
    >
      <path
        fill="currentColor"
        d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"
      />
      <path
        fill="currentColor"
        d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"
      />
    </svg>
  );
}

interface MoneyAmountProps {
  amount: number;
  currency?: string | null;
  suffix?: string;
  className?: string;
  symbolSize?: number;
  locale?: string;
  /** rtl for Arabic PDF/UI so the icon reads after the number */
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
          flexWrap: "nowrap",
          direction: priceDirection,
          unicodeBidi: "isolate",
          alignItems: "flex-end",
          fontSize: symbolSize,
          lineHeight: 1,
          gap: "0.22em",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ lineHeight: 1 }}>{formatted}</span>
        <RiyalSymbol
          style={{
            width: "0.78em",
            height: "0.82em",
            transform: "translateY(0.1em)",
          }}
        />
        {suffix ? <span style={{ lineHeight: 1 }}>{suffix}</span> : null}
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
