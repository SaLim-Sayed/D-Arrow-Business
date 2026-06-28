import { Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaxSettings } from "../schemas/settings";
import { taxOptionLabel } from "../utils/product-labels";
import { getActiveTaxes } from "../utils/tax-utils";
import { selectFieldProps } from "@/components/shared/select-field";

interface LineTaxRateSelectProps {
  taxes: TaxSettings[];
  taxRateId?: string | null;
  onChange: (tax: TaxSettings | null) => void;
  size?: "sm" | "md" | "lg";
}

export function LineTaxRateSelect({
  taxes,
  taxRateId,
  onChange,
  size = "sm",
}: LineTaxRateSelectProps) {
  const { t } = useTranslation("billing");
  const activeTaxes = getActiveTaxes(taxes);

  return (
    <Select
      {...selectFieldProps({ compact: size === "sm" })}
      size={size}
      aria-label={t("invoices.create.select_tax")}
      placeholder={t("invoices.create.select_tax")}
      variant="flat"
      selectedKeys={taxRateId ? new Set([taxRateId]) : new Set()}
      onSelectionChange={(keys) => {
        const id = Array.from(keys)[0] as string | undefined;
        const tax = activeTaxes.find((tx) => tx.id === id) ?? null;
        onChange(tax);
      }}
      items={activeTaxes}
    >
      {(tax) => (
        <SelectItem key={tax.id} textValue={taxOptionLabel(t, tax)}>
          {taxOptionLabel(t, tax)}
        </SelectItem>
      )}
    </Select>
  );
}
