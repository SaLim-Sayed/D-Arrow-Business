import { Input } from "@heroui/react";
import { RiyalSymbol } from "@/components/shared/riyal-symbol";
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
  const currencyEnd = <RiyalSymbol size={size === "sm" ? 12 : 14} />;

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
