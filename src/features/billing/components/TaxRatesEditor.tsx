import {
  Button,
  Checkbox,
  Input,
  Switch,
} from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import type {
  FieldArrayWithId,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { taxLabel } from "../utils/product-labels";
import { isSystemTax } from "../utils/tax-utils";

interface TaxRatesEditorProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  taxFields: FieldArrayWithId<any, "taxes", "id">[];
  appendTax: (value: {
    id: string;
    name: string;
    rate: number;
    isDefault: boolean;
    isActive: boolean;
  }) => void;
  removeTax: (index: number) => void;
}

export function TaxRatesEditor({
  register,
  watch,
  setValue,
  taxFields,
  appendTax,
  removeTax,
}: TaxRatesEditorProps) {
  const { t } = useTranslation("billing");
  const { t: tc } = useTranslation("common");

  const setDefaultTax = (index: number) => {
    taxFields.forEach((_, i) => {
      setValue(`taxes.${i}.isDefault`, i === index, { shouldDirty: true });
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-content1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default-200 bg-default-50/90 px-3 py-2">
        <div>
          <h3 className="text-sm font-bold text-default-800">
            {t("settings.tax_rates")}
          </h3>
          <p className="text-xs text-default-500">{t("settings.tax_help")}</p>
        </div>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() =>
            appendTax({
              id: `tax_${Date.now()}`,
              name: "",
              rate: 0,
              isDefault: taxFields.length === 0,
              isActive: true,
            })
          }
        >
          {t("settings.add_tax")}
        </Button>
      </div>

      {taxFields.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-default-500">
          {t("settings.tax_empty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-start">
            <thead>
              <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                <th className="px-3 py-2.5 font-semibold">
                  {t("settings.tax_name")}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {t("settings.tax_rate_value")}
                </th>
                <th className="px-3 py-2.5 text-center font-semibold">
                  {t("settings.tax_default")}
                </th>
                <th className="px-3 py-2.5 text-center font-semibold">
                  {t("settings.tax_active")}
                </th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {taxFields.map((field, index) => {
                const taxId = watch(`taxes.${index}.id`) ?? field.id;
                const taxName = watch(`taxes.${index}.name`) ?? "";
                const isDefault = watch(`taxes.${index}.isDefault`) ?? false;
                const isActive = watch(`taxes.${index}.isActive`) ?? true;
                const isSystem = isSystemTax(taxId);
                const displayName = taxLabel(t, { id: taxId, name: taxName });

                return (
                  <tr
                    key={field.id}
                    className={cn(
                      "border-b border-default-100 text-sm",
                      !isActive && "opacity-60"
                    )}
                  >
                    <td className="px-3 py-2">
                      <input type="hidden" {...register(`taxes.${index}.id`)} />
                      {isSystem ? (
                        <div>
                          <span className="font-medium text-default-900">
                            {displayName}
                          </span>
                          <input type="hidden" {...register(`taxes.${index}.name`)} />
                        </div>
                      ) : (
                        <Input
                          size="sm"
                          aria-label={t("settings.tax_name")}
                          {...register(`taxes.${index}.name`)}
                          placeholder={t("settings.tax_name_placeholder")}
                          variant="flat"
                          classNames={{
                            inputWrapper:
                              "bg-white dark:bg-content1 shadow-none border border-default-200",
                          }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        size="sm"
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        aria-label={t("settings.tax_rate_value")}
                        {...register(`taxes.${index}.rate`, {
                          valueAsNumber: true,
                        })}
                        variant="flat"
                        dir="ltr"
                        classNames={{
                          input: "text-start",
                          inputWrapper:
                            "bg-white dark:bg-content1 shadow-none border border-default-200",
                        }}
                        endContent={
                          <span className="text-xs text-default-400">%</span>
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          size="sm"
                          isSelected={isDefault}
                          onValueChange={() => setDefaultTax(index)}
                          aria-label={t("settings.tax_default")}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <Switch
                          size="sm"
                          isSelected={isActive}
                          onValueChange={(value) =>
                            setValue(`taxes.${index}.isActive`, value, {
                              shouldDirty: true,
                            })
                          }
                          aria-label={t("settings.tax_active")}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        aria-label={tc("actions.delete")}
                        onPress={() => removeTax(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
