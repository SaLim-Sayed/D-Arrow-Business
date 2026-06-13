import { Input } from "@heroui/react";
import { RiyalSymbol } from "@/components/shared/riyal-symbol";
import { isSarCurrency } from "@/lib/utils";
import {
  formatPriceDisplay,
  parsePriceInput,
} from "../utils/quotation-calculations";

interface QuotationPriceInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string | null;
  label?: string;
  size?: "sm" | "md";
  className?: string;
  placeholder?: string;
}

export function QuotationPriceInput({
  value,
  onChange,
  currency,
  label,
  size = "md",
  className,
  placeholder = "0",
}: QuotationPriceInputProps) {
  const currencyEnd = isSarCurrency(currency) ? (
    <RiyalSymbol size={size === "sm" ? 12 : 14} />
  ) : (
    <span className="text-xs text-default-400 font-medium">
      {(currency ?? "SAR").toUpperCase()}
    </span>
  );

  return (
    <Input
      label={label}
      size={size}
      className={className}
      inputMode="numeric"
      placeholder={placeholder}
      dir="ltr"
      value={formatPriceDisplay(value)}
      onValueChange={(raw) => onChange(parsePriceInput(raw))}
      endContent={currencyEnd}
      classNames={{
        input: "text-end font-semibold tabular-nums",
        inputWrapper: "min-w-[120px]",
      }}
    />
  );
}
