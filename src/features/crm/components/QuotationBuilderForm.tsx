import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Divider,
  DatePicker,
  Textarea,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { FileDown, Eye } from "lucide-react";
import { useCompanyProfile } from "@/features/companies/hooks/use-company-profile";
import { usePricingList } from "@/features/companies/hooks/use-pricing";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import {
  QUOTATION_BASE_PACKAGE,
  QUOTATION_OPTIONAL_ADDONS,
} from "../constants/quotation-templates";
import { QuotationPrintDocument } from "./QuotationPrintDocument";
import { QuotationPriceInput } from "./QuotationPriceInput";
import { generateQuotationPdf } from "../utils/generate-quotation-pdf";
import {
  calculateQuotationTotals,
  formatQuoteNumber,
  formatQuotationDateFromIso,
  toQuotationDateIso,
} from "../utils/quotation-calculations";
import { resolveQuotationLocale, itemDescription, itemServiceName, catalogItemName } from "../utils/quotation-direction";
import type { QuotationLocale } from "../utils/quotation-direction";
import type { QuotationData, QuotationLineItem } from "../types/quotation.types";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { toast } from "sonner";

function buildCompanyInfo(
  profile: ReturnType<typeof useCompanyProfile>["data"]
): QuotationData["company"] {
  const city = profile?.city?.trim();
  const country = profile?.country?.trim() || "المملكة العربية السعودية";
  const addressAr = [profile?.address, city, country].filter(Boolean).join("، ") ||
    "الأحساء، المملكة العربية السعودية";
  const addressEn = [profile?.address, city, country].filter(Boolean).join(", ") ||
    "Al Ahsa, Kingdom of Saudi Arabia";

  return {
    nameAr: profile?.nameAr || "شركة دي آرو للتسويق",
    nameEn: profile?.name || profile?.legalName || "D Arrow Marketing Company",
    commercialRegister: profile?.commercialRegister || "7053575184",
    taxNumber: profile?.taxNumber || "314611548300003",
    addressAr,
    addressEn,
    phone: profile?.phone || "0500466349",
    email: profile?.email || "info@d-arrow.com",
    website: "https://d-arrow.com",
    districtAr: profile?.address || "حي الياسمين، الأحساء",
    districtEn: profile?.address || "Al Yasmin District, Al Ahsa",
  };
}

export function QuotationBuilderForm() {
  const { t, i18n } = useTranslation("crm");
  const quoteLocale = resolveQuotationLocale(i18n.language);
  const { data: company } = useCompanyProfile();
  const { data: prices = [] } = usePricingList();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const printRef = useRef<HTMLDivElement>(null);

  const activePrices = useMemo(
    () => prices.filter((p) => p.status === "active"),
    [prices]
  );

  const [quoteNumber, setQuoteNumber] = useState(() => formatQuoteNumber());
  const [quoteDateIso, setQuoteDateIso] = useState(() => toQuotationDateIso());
  const [validityMonths, setValidityMonths] = useState(3);
  const [clientName, setClientName] = useState("");
  const [clientCr, setClientCr] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [includeBase, setIncludeBase] = useState(true);
  const [basePrice, setBasePrice] = useState(9000);
  const [selectedPriceIds, setSelectedPriceIds] = useState<Set<string>>(new Set());
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [addonPrices, setAddonPrices] = useState<Record<string, number>>({});
  const [itemDescriptions, setItemDescriptions] = useState<
    Record<string, Partial<Record<QuotationLocale, string>>>
  >({});
  const [notesByLocale, setNotesByLocale] = useState<
    Partial<Record<QuotationLocale, string>>
  >({});
  const notesTouchedByLocale = useRef<Partial<Record<QuotationLocale, boolean>>>({});
  const [vatRate, setVatRate] = useState(15);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const defaultNotes = useMemo(
    () =>
      t("quotation.pdf.validityNote", {
        months: validityMonths,
        unit:
          validityMonths === 1
            ? t("quotation.pdf.month")
            : t("quotation.pdf.months"),
      }),
    [t, validityMonths]
  );

  useEffect(() => {
    if (!notesTouchedByLocale.current[quoteLocale]) {
      setNotesByLocale((prev) => ({ ...prev, [quoteLocale]: defaultNotes }));
    }
  }, [defaultNotes, quoteLocale]);

  const notesValue = notesByLocale[quoteLocale] ?? defaultNotes;

  const addonItems = useMemo(
    () =>
      QUOTATION_OPTIONAL_ADDONS.map((addon, i) => ({
        ...addon,
        id: `addon-${i}`,
      })),
    []
  );

  const setItemDescription = (id: string, value: string) => {
    setItemDescriptions((prev) => ({
      ...prev,
      [id]: { ...prev[id], [quoteLocale]: value },
    }));
  };

  const displayDescription = (
    id: string,
    item: {
      descriptionAr?: string;
      descriptionEn?: string;
      description?: string;
    }
  ) => itemDescriptions[id]?.[quoteLocale] ?? itemDescription(item, quoteLocale);

  const applyItemDescription = (
    id: string,
    item: {
      descriptionAr?: string;
      descriptionEn?: string;
      description?: string;
    }
  ) => {
    const custom = itemDescriptions[id]?.[quoteLocale]?.trim();
    if (custom) {
      return quoteLocale === "ar"
        ? { descriptionAr: custom, descriptionEn: item.descriptionEn, description: item.description }
        : { descriptionEn: custom, descriptionAr: item.descriptionAr, description: item.description };
    }
    return {
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      description: item.description,
    };
  };

  const quotationData = useMemo((): QuotationData => {
    const items: QuotationLineItem[] = [];

    const selectedAddons = addonItems.filter((a) => selectedAddonIds.has(a.id));
    const getAddonPrice = (id: string, fallback: number) =>
      addonPrices[id] ?? fallback;

    if (includeBase) {
      const bundledLines = selectedAddons
        .filter((a) => getAddonPrice(a.id, a.unitPrice) === 0)
        .map((a) => {
          const custom = itemDescriptions[a.id]?.[quoteLocale]?.trim();
          return custom || itemDescription(a, quoteLocale);
        })
        .filter(Boolean);

      items.push({
        id: "base",
        nameAr: QUOTATION_BASE_PACKAGE.nameAr,
        nameEn: QUOTATION_BASE_PACKAGE.nameEn,
        ...applyItemDescription("base", QUOTATION_BASE_PACKAGE),
        descriptionLines: bundledLines.length ? bundledLines : undefined,
        quantity: 1,
        unitPrice: basePrice,
      });

      for (const addon of selectedAddons) {
        const price = getAddonPrice(addon.id, addon.unitPrice);
        if (price > 0) {
          items.push({
            ...addon,
            ...applyItemDescription(addon.id, addon),
            unitPrice: price,
          });
        }
      }
    } else {
      for (const addon of selectedAddons) {
        items.push({
          ...addon,
          ...applyItemDescription(addon.id, addon),
          unitPrice: getAddonPrice(addon.id, addon.unitPrice),
        });
      }
    }

    for (const price of activePrices) {
      if (!selectedPriceIds.has(price.id)) continue;
      items.push({
        id: price.id,
        nameAr: price.nameAr || price.name,
        nameEn: price.name,
        ...applyItemDescription(price.id, {
          description: price.description,
          descriptionAr: price.description,
          descriptionEn: price.description,
        }),
        quantity: 1,
        unitPrice: price.unitPrice,
      });
    }

    return {
      quoteNumber,
      quoteDate: formatQuotationDateFromIso(quoteDateIso),
      validityMonths,
      company: buildCompanyInfo(company),
      client: { name: clientName, commercialRegister: clientCr || undefined },
      items,
      currency: company?.defaultCurrency || "SAR",
      vatRate,
      pricesIncludeVat,
      notes: notesValue.trim() || defaultNotes,
    };
  }, [
    includeBase,
    basePrice,
    activePrices,
    selectedPriceIds,
    addonItems,
    selectedAddonIds,
    addonPrices,
    itemDescriptions,
    quoteNumber,
    quoteDateIso,
    validityMonths,
    notesByLocale,
    defaultNotes,
    company,
    clientName,
    clientCr,
    vatRate,
    pricesIncludeVat,
    quoteLocale,
  ]);

  const totals = useMemo(
    () => calculateQuotationTotals(quotationData),
    [quotationData]
  );

  const onContactSelect = (id: string) => {
    setSelectedContactId(id);
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      setClientName(contactDisplayName(contact));
      setClientCr(contact.commercialRegister || "");
    }
  };

  const togglePrice = (id: string, checked: boolean) => {
    setSelectedPriceIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAddon = (id: string, checked: boolean) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleExport = async () => {
    if (!clientName.trim()) {
      toast.error(t("quotation.clientRequired"));
      return;
    }
    if (quotationData.items.length === 0) {
      toast.error(t("quotation.itemsRequired"));
      return;
    }

    setShowPreview(true);
    setExporting(true);

    requestAnimationFrame(async () => {
      try {
        const el = printRef.current;
        if (!el) throw new Error("Print element not found");
        await generateQuotationPdf(
          el,
          `quotation-${quoteNumber}-${quoteDateIso}.pdf`
        );
        toast.success(t("quotation.exportSuccess"));
      } catch {
        toast.error(t("quotation.exportError"));
      } finally {
        setExporting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-default-100">
        <CardBody className="gap-5 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label={t("quotation.quoteNumber")}
              value={quoteNumber}
              onValueChange={setQuoteNumber}
            />
            <DatePicker
              label={t("quotation.quoteDate")}
              value={parseDate(quoteDateIso)}
              onChange={(date) => {
                if (date) setQuoteDateIso(date.toString());
              }}
              showMonthAndYearPickers
              className="w-full"
            />
            <Input
              label={t("quotation.validityMonths")}
              type="number"
              min={1}
              max={12}
              value={String(validityMonths)}
              onValueChange={(v) => setValidityMonths(Number(v) || 3)}
            />
            <Input
              label={t("quotation.vatRate")}
              type="number"
              min={0}
              max={100}
              value={String(vatRate)}
              onValueChange={(v) => setVatRate(Number(v) || 15)}
            />
          </div>

          <Divider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t("quotation.selectContact")}
              selectedKeys={selectedContactId ? [selectedContactId] : []}
              onSelectionChange={(keys) => {
                const id = Array.from(keys)[0] as string;
                if (id) onContactSelect(id);
              }}
            >
              {contacts.map((c) => (
                <SelectItem key={c.id}>{contactDisplayName(c)}</SelectItem>
              ))}
            </Select>
            <Input
              label={t("quotation.clientName")}
              value={clientName}
              onValueChange={setClientName}
              isRequired
            />
            <Input
              label={t("quotation.clientCr")}
              value={clientCr}
              onValueChange={setClientCr}
              placeholder="7053575184"
            />
          </div>

          <Divider />

          {/* Base package */}
          <div>
            <p className="text-sm font-bold mb-3">{t("quotation.basePackage")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Checkbox isSelected={includeBase} onValueChange={setIncludeBase}>
                {itemServiceName(QUOTATION_BASE_PACKAGE, quoteLocale)}
              </Checkbox>
              {includeBase && (
                <QuotationPriceInput
                  label={t("quotation.price")}
                  className="max-w-[180px]"
                  value={basePrice}
                  onChange={setBasePrice}
                  currency={company?.defaultCurrency || "SAR"}
                />
              )}
            </div>
            {includeBase && (
              <p className="text-xs text-default-400 mt-1">
                {t("quotation.basePackageHint")}
              </p>
            )}
            {includeBase && (
              <Textarea
                key={`base-desc-${quoteLocale}`}
                className="mt-3"
                label={t("quotation.description")}
                value={displayDescription("base", QUOTATION_BASE_PACKAGE)}
                onValueChange={(value) => setItemDescription("base", value)}
                minRows={2}
              />
            )}
          </div>

          {/* Price catalog */}
          {activePrices.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-3">{t("quotation.fromCatalog")}</p>
              <div className="grid grid-cols-1 gap-3">
                {activePrices.map((price) => {
                  const selected = selectedPriceIds.has(price.id);
                  return (
                    <div
                      key={price.id}
                      className="p-3 rounded-lg border border-default-100 space-y-3"
                    >
                      <Checkbox
                        isSelected={selected}
                        onValueChange={(checked) => togglePrice(price.id, checked)}
                      >
                        <span className="text-sm inline-flex items-center gap-1.5">
                          {catalogItemName(price, quoteLocale)}
                          <span className="text-default-400">—</span>
                          <MoneyAmount
                            amount={price.unitPrice}
                            currency={price.currency}
                            symbolSize={12}
                          />
                        </span>
                      </Checkbox>
                      {selected && (
                        <Textarea
                          key={`${price.id}-desc-${quoteLocale}`}
                          label={t("quotation.description")}
                          size="sm"
                          value={displayDescription(price.id, {
                            description: price.description,
                            descriptionAr: price.description,
                            descriptionEn: price.description,
                          })}
                          onValueChange={(value) =>
                            setItemDescription(price.id, value)
                          }
                          minRows={2}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional add-ons */}
          <div>
            <p className="text-sm font-bold mb-1">{t("quotation.optionalAddons")}</p>
            <p className="text-xs text-default-400 mb-3">{t("quotation.optionalHint")}</p>
            <div className="grid grid-cols-1 gap-3">
              {addonItems.map((addon) => {
                const selected = selectedAddonIds.has(addon.id);
                return (
                  <div
                    key={addon.id}
                    className="p-3 rounded-lg border border-default-100 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Checkbox
                        isSelected={selected}
                        onValueChange={(checked) => toggleAddon(addon.id, checked)}
                      >
                        <span className="text-sm font-medium">
                          {itemServiceName(addon, quoteLocale)}
                        </span>
                      </Checkbox>
                      {selected && (
                        <QuotationPriceInput
                          size="sm"
                          className="max-w-[130px]"
                          value={addonPrices[addon.id] ?? addon.unitPrice}
                          onChange={(v) =>
                            setAddonPrices((prev) => ({
                              ...prev,
                              [addon.id]: v,
                            }))
                          }
                          currency={company?.defaultCurrency || "SAR"}
                          label={t("quotation.price")}
                        />
                      )}
                    </div>
                    {selected && (
                      <Textarea
                        key={`${addon.id}-desc-${quoteLocale}`}
                        label={t("quotation.description")}
                        size="sm"
                        value={displayDescription(addon.id, addon)}
                        onValueChange={(value) =>
                          setItemDescription(addon.id, value)
                        }
                        minRows={2}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Checkbox isSelected={pricesIncludeVat} onValueChange={setPricesIncludeVat}>
            {t("quotation.pricesIncludeVat")}
          </Checkbox>

          <Textarea
            key={`notes-${quoteLocale}`}
            label={t("quotation.notes")}
            value={notesValue}
            onValueChange={(value) => {
              notesTouchedByLocale.current[quoteLocale] = true;
              setNotesByLocale((prev) => ({ ...prev, [quoteLocale]: value }));
            }}
            minRows={2}
            description={t("quotation.notesHint")}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-default-100">
            <div className="text-sm">
              <p>
                {t("quotation.total")}:{" "}
                <strong>
                  <MoneyAmount
                    amount={totals.total}
                    currency={quotationData.currency}
                    suffix={
                      pricesIncludeVat ? t("quotation.includingVat") : undefined
                    }
                  />
                </strong>
              </p>
              <p className="text-default-400 text-xs">
                {t("quotation.selectedItems", {
                  count: quotationData.items.length,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                startContent={<Eye className="h-4 w-4" />}
                onPress={() => setShowPreview((v) => !v)}
              >
                {showPreview ? t("quotation.hidePreview") : t("quotation.preview")}
              </Button>
              <Button
                color="primary"
                className="rounded-full font-bold"
                startContent={<FileDown className="h-4 w-4" />}
                isLoading={exporting}
                onPress={handleExport}
              >
                {t("quotation.downloadPdf")}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="border border-default-100 overflow-auto">
          <CardBody className="p-4 bg-default-50">
            <div className="mx-auto shadow-lg" style={{ width: "210mm" }}>
              <QuotationPrintDocument data={quotationData} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Hidden PDF render target */}
      <div
        ref={printRef}
        aria-hidden
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "210mm",
          pointerEvents: "none",
        }}
      >
        <QuotationPrintDocument data={quotationData} />
      </div>
    </div>
  );
}
