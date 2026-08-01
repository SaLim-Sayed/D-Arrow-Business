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
  Textarea,
} from "@heroui/react";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { parseDate } from "@internationalized/date";
import { FileDown, Eye, Save, Trash2, Receipt, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanyProfile } from "@/features/companies/hooks/use-company-profile";
import { usePricingList } from "@/features/companies/hooks/use-pricing";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { selectFieldProps } from "@/components/shared/select-field";
import { QuotationPrintDocument } from "./QuotationPrintDocument";
import { QuotationPriceInput } from "./QuotationPriceInput";
import { QuotationSavedMenu } from "./QuotationSavedMenu";
import { generateQuotationPdf } from "../utils/generate-quotation-pdf";
import {
  calculateQuotationTotals,
  formatQuotationDateFromIso,
} from "../utils/quotation-calculations";
import {
  resolveQuotationLocale,
  itemServiceName,
} from "../utils/quotation-direction";
import type { QuotationLocale } from "../utils/quotation-direction";
import type {
  QuotationData,
  QuotationDraftLine,
  QuotationFormDraft,
  QuotationLineItem,
  QuotationRecipientTitle,
} from "../types/quotation.types";
import { QUOTATION_RECIPIENT_TITLES } from "../utils/quotation-recipient-title";
import {
  buildQuotationCatalogOptions,
  buildQuotationTitle,
  createCustomLine,
  createDefaultQuotationFormDraft,
  createLineFromCatalogOption,
  lineDisplayDescription,
  normalizeQuotationDraft,
  updateLineDescription,
  updateLineName,
} from "../utils/quotation-form-state";
import {
  useQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} from "../hooks/use-quotations";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { toast } from "sonner";

function buildCompanyInfo(
  profile: ReturnType<typeof useCompanyProfile>["data"]
): QuotationData["company"] {
  const city = profile?.city?.trim();
  const country = profile?.country?.trim() || "المملكة العربية السعودية";
  const addressAr =
    [profile?.address, city, country].filter(Boolean).join("، ") ||
    "الأحساء، المملكة العربية السعودية";
  const addressEn =
    [profile?.address, city, country].filter(Boolean).join(", ") ||
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
  const navigate = useNavigate();
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

  const catalogOptions = useMemo(
    () => buildQuotationCatalogOptions(activePrices),
    [activePrices]
  );

  const defaultDraft = useMemo(() => createDefaultQuotationFormDraft(), []);

  const [quoteNumber, setQuoteNumber] = useState(defaultDraft.quoteNumber);
  const [quoteDateIso, setQuoteDateIso] = useState(defaultDraft.quoteDateIso);
  const [validityMonths, setValidityMonths] = useState(defaultDraft.validityMonths);
  const [clientName, setClientName] = useState("");
  const [clientCr, setClientCr] = useState("");
  const [recipientTitle, setRecipientTitle] =
    useState<QuotationRecipientTitle>("mr");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [lines, setLines] = useState<QuotationDraftLine[]>(defaultDraft.lines);
  const [notesByLocale, setNotesByLocale] = useState<
    Partial<Record<QuotationLocale, string>>
  >({});
  const notesTouchedByLocale = useRef<Partial<Record<QuotationLocale, boolean>>>(
    {}
  );
  const [vatRate, setVatRate] = useState(15);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);

  const { data: savedQuotationsRes, isLoading: isLoadingSaved } =
    useQuotationsQuery();
  const savedQuotations = savedQuotationsRes?.data ?? [];
  const createQuotation = useCreateQuotationMutation();
  const updateQuotation = useUpdateQuotationMutation();
  const deleteQuotation = useDeleteQuotationMutation();
  const isSaving = createQuotation.isPending || updateQuotation.isPending;

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

  const quotationData = useMemo((): QuotationData => {
    const items: QuotationLineItem[] = lines
      .filter((line) => {
        const name = itemServiceName(line, quoteLocale).trim();
        const desc = lineDisplayDescription(line, quoteLocale).trim();
        return name.length > 0 || desc.length > 0 || line.unitPrice > 0;
      })
      .map((line) => ({
        id: line.id,
        nameAr: line.nameAr || line.descriptionAr || "",
        nameEn: line.nameEn || line.descriptionEn || line.nameAr,
        descriptionAr: line.descriptionAr,
        descriptionEn: line.descriptionEn,
        description:
          quoteLocale === "ar" ? line.descriptionAr : line.descriptionEn,
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice,
      }));

    return {
      quoteNumber,
      quoteDate: formatQuotationDateFromIso(quoteDateIso),
      validityMonths,
      company: buildCompanyInfo(company),
      client: {
        name: clientName,
        commercialRegister: clientCr || undefined,
        recipientTitle,
      },
      items,
      currency: "SAR",
      vatRate,
      pricesIncludeVat,
      notes: notesValue.trim() || defaultNotes,
    };
  }, [
    lines,
    quoteNumber,
    quoteDateIso,
    validityMonths,
    notesValue,
    defaultNotes,
    company,
    clientName,
    clientCr,
    recipientTitle,
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

  const updateLine = (lineId: string, updater: (line: QuotationDraftLine) => QuotationDraftLine) => {
    setLines((prev) => prev.map((line) => (line.id === lineId ? updater(line) : line)));
  };

  const selectableOptions = useMemo(
    () => catalogOptions.filter((o) => o.group !== "custom"),
    [catalogOptions]
  );

  const handlePickCatalogItem = (optionId: string) => {
    const option = selectableOptions.find((o) => o.id === optionId);
    if (!option) return;
    setLines((prev) => [...prev, createLineFromCatalogOption(option)]);
  };

  const handleAddNewItem = () => {
    setLines((prev) => [...prev, createCustomLine()]);
  };

  const handleRemoveLine = (lineId: string) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const applyDraft = (draft: QuotationFormDraft) => {
    const normalized = normalizeQuotationDraft(draft, activePrices);
    setQuoteNumber(normalized.quoteNumber);
    setQuoteDateIso(normalized.quoteDateIso);
    setValidityMonths(normalized.validityMonths);
    setClientName(normalized.clientName);
    setClientCr(normalized.clientCr);
    setRecipientTitle(normalized.recipientTitle ?? "mr");
    setSelectedContactId(normalized.selectedContactId);
    setLines(normalized.lines);
    setNotesByLocale(normalized.notesByLocale);
    setVatRate(normalized.vatRate);
    setPricesIncludeVat(normalized.pricesIncludeVat);
    notesTouchedByLocale.current = {
      ar: !!normalized.notesByLocale?.ar,
      en: !!normalized.notesByLocale?.en,
    };
  };

  const buildDraft = (): QuotationFormDraft => ({
    quoteNumber,
    quoteDateIso,
    validityMonths,
    clientName,
    clientCr,
    recipientTitle,
    selectedContactId,
    lines,
    notesByLocale,
    vatRate,
    pricesIncludeVat,
  });

  const handleNewQuotation = () => {
    setSavedQuotationId(null);
    applyDraft(createDefaultQuotationFormDraft());
    setShowPreview(false);
  };

  const handleLoadQuotation = (id: string) => {
    const saved = savedQuotations.find((q) => q.id === id);
    if (!saved) return;
    setSavedQuotationId(saved.id);
    applyDraft(normalizeQuotationDraft(saved.form, activePrices));
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error(t("quotation.clientRequired"));
      return;
    }

    const form = buildDraft();
    const payload = {
      title: buildQuotationTitle(
        clientName,
        quoteNumber,
        t("quotation.untitled")
      ),
      status: "draft" as const,
      form,
      total: totals.total,
      currency: quotationData.currency,
      contactId: selectedContactId || undefined,
    };

    try {
      if (savedQuotationId) {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          data: payload,
        });
      } else {
        const res = await createQuotation.mutateAsync(payload);
        setSavedQuotationId(res.data.id);
      }
    } catch {
      // toast handled in mutation
    }
  };

  const handleDelete = async () => {
    if (!savedQuotationId) return;
    try {
      await deleteQuotation.mutateAsync(savedQuotationId);
      handleNewQuotation();
    } catch {
      // toast handled in mutation
    }
  };

  const handleConvertToInvoice = () => {
    if (!selectedContactId) {
      toast.error(t("quotation.contactRequiredForInvoice"));
      return;
    }
    if (quotationData.items.length === 0) {
      toast.error(t("quotation.itemsRequired"));
      return;
    }
    navigate("/billing/invoices/new", {
      state: {
        fromQuotation: {
          quotationId: savedQuotationId ?? undefined,
          contactId: selectedContactId,
          data: {
            currency: quotationData.currency,
            vatRate: quotationData.vatRate,
            pricesIncludeVat: quotationData.pricesIncludeVat,
            notes: quotationData.notes,
            validityMonths: quotationData.validityMonths,
            items: quotationData.items.map((item) => ({
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      },
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

    setExporting(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

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
  };

  const optionLabel = (optionId: string) => {
    const option = selectableOptions.find((o) => o.id === optionId);
    if (!option) return t("quotation.selectItem");
    const name = quoteLocale === "ar" ? option.nameAr : option.nameEn;
    return name;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] gap-4 items-start">
      <QuotationSavedMenu
        quotations={savedQuotations}
        activeId={savedQuotationId}
        isLoading={isLoadingSaved}
        onSelect={handleLoadQuotation}
        onNew={handleNewQuotation}
      />

      <div className="space-y-6 min-w-0">
        <Card className="border border-default-100">
          <CardBody className="gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {savedQuotationId
                    ? savedQuotations.find((q) => q.id === savedQuotationId)
                        ?.title ?? t("quotation.newQuote")
                    : t("quotation.newQuote")}
                </p>
                <p className="text-xs text-default-400">
                  {savedQuotationId
                    ? t("quotation.editingSaved")
                    : t("quotation.unsavedDraft")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<Receipt className="h-4 w-4" />}
                  onPress={handleConvertToInvoice}
                >
                  {t("quotation.convertToInvoice")}
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Save className="h-4 w-4" />}
                  isLoading={isSaving}
                  onPress={handleSave}
                >
                  {t("quotation.save")}
                </Button>
                {savedQuotationId && (
                  <Button
                    color="danger"
                    variant="light"
                    startContent={<Trash2 className="h-4 w-4" />}
                    isLoading={deleteQuotation.isPending}
                    onPress={handleDelete}
                  >
                    {t("quotation.delete")}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100">
          <CardBody className="gap-5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label={t("quotation.quoteNumber")}
                value={quoteNumber}
                onValueChange={setQuoteNumber}
              />
              <AppDatePicker
                label={t("quotation.quoteDate")}
                value={parseDate(quoteDateIso)}
                onChange={(date: { toString(): string } | null) => {
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                {...selectFieldProps()}
                label={t("quotation.selectContact")}
                selectedKeys={selectedContactId ? [selectedContactId] : []}
                onSelectionChange={(keys) => {
                  const id = Array.from(keys)[0] as string;
                  if (id) onContactSelect(id);
                }}
              >
                {contacts.map((c) => (
                  <SelectItem key={c.id} textValue={contactDisplayName(c)}>
                    {contactDisplayName(c)}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex gap-2 items-center sm:col-span-2 lg:col-span-2">
                <Select
                  {...selectFieldProps()}
                  label={t("quotation.recipientTitle.label")}
                  className="w-[140px] shrink-0"
                  selectedKeys={[recipientTitle]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as QuotationRecipientTitle;
                    if (value) setRecipientTitle(value);
                  }}
                >
                  {QUOTATION_RECIPIENT_TITLES.map((title) => (
                    <SelectItem
                      key={title}
                      textValue={t(`quotation.pdf.recipientTitle.${title}`)}
                    >
                      {t(`quotation.pdf.recipientTitle.${title}`)}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  label={t("quotation.clientName")}
                  className="flex-1 min-w-0"
                  value={clientName}
                  onValueChange={setClientName}
                  isRequired
                />
              </div>
              <Input
                label={t("quotation.clientCr")}
                value={clientCr}
                onValueChange={setClientCr}
                placeholder="7053575184"
              />
            </div>

            <Divider />

            {/* Line items */}
            <div className="space-y-3">
              <p className="text-sm font-bold">{t("quotation.lineItems")}</p>
              <p className="text-xs text-default-400">{t("quotation.lineItemsHint")}</p>

              <div className="flex flex-wrap items-end gap-3">
                <Select
                  {...selectFieldProps()}
                  className="flex-1 min-w-[220px]"
                  label={t("quotation.selectItem")}
                  placeholder={t("quotation.selectItemPlaceholder")}
                  selectedKeys={[]}
                  onSelectionChange={(keys) => {
                    const id = Array.from(keys)[0] as string;
                    if (id) handlePickCatalogItem(id);
                  }}
                >
                  {selectableOptions.map((option) => {
                    const label =
                      quoteLocale === "ar" ? option.nameAr : option.nameEn;
                    return (
                      <SelectItem
                        key={option.id}
                        textValue={`${label} ${option.unitPrice}`}
                      >
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="truncate">{label}</span>
                          <span className="text-default-400 shrink-0">
                            —{" "}
                            <MoneyAmount
                              amount={option.unitPrice}
                              currency="SAR"
                              symbolSize={11}
                              priceDirection={
                                quoteLocale === "ar" ? "rtl" : "ltr"
                              }
                            />
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </Select>

                <Button
                  color="primary"
                  variant="flat"
                  className="shrink-0"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={handleAddNewItem}
                >
                  {t("quotation.addNewItem")}
                </Button>
              </div>

              <div className="space-y-3">
                {lines.length === 0 && (
                  <p className="text-sm text-default-400 py-6 text-center border border-dashed border-default-200 rounded-lg">
                    {t("quotation.noLinesYet")}
                  </p>
                )}

                {lines.map((line) => {
                  const serviceName =
                    quoteLocale === "ar"
                      ? line.nameAr
                      : line.nameEn || line.nameAr;

                  return (
                    <div
                      key={line.id}
                      className="p-3 rounded-lg border border-default-100 space-y-3"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <Input
                          size="sm"
                          className="flex-1 min-w-[180px]"
                          label={t("quotation.itemName")}
                          value={serviceName}
                          onValueChange={(value) =>
                            updateLine(line.id, (prev) =>
                              updateLineName(prev, quoteLocale, value)
                            )
                          }
                          placeholder={
                            line.sourceId
                              ? optionLabel(line.sourceId)
                              : t("quotation.customItem")
                          }
                        />

                        <QuotationPriceInput
                          size="sm"
                          className="w-[140px] shrink-0"
                          label={t("quotation.price")}
                          value={line.unitPrice}
                          onChange={(v) =>
                            updateLine(line.id, (prev) => ({
                              ...prev,
                              unitPrice: v,
                            }))
                          }
                          currency="SAR"
                        />

                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          className="mt-5"
                          aria-label={t("quotation.removeLine")}
                          onPress={() => handleRemoveLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Textarea
                        key={`${line.id}-desc-${quoteLocale}`}
                        size="sm"
                        label={t("quotation.itemDescription")}
                        value={lineDisplayDescription(line, quoteLocale)}
                        onValueChange={(value) =>
                          updateLine(line.id, (prev) =>
                            updateLineDescription(prev, quoteLocale, value)
                          )
                        }
                        minRows={2}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Checkbox
              isSelected={pricesIncludeVat}
              onValueChange={setPricesIncludeVat}
            >
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
                      priceDirection={quoteLocale === "ar" ? "rtl" : "ltr"}
                      suffix={
                        pricesIncludeVat
                          ? t("quotation.includingVat")
                          : undefined
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
                  {showPreview
                    ? t("quotation.hidePreview")
                    : t("quotation.preview")}
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

        {showPreview && (
          <Card className="border border-default-100 overflow-auto">
            <CardBody className="p-4 bg-default-50">
              <div className="mx-auto shadow-lg" style={{ width: "210mm" }}>
                <QuotationPrintDocument data={quotationData} />
              </div>
            </CardBody>
          </Card>
        )}

        <div
          ref={printRef}
          aria-hidden
          style={{
            position: "fixed",
            left: "-12000px",
            top: 0,
            width: "210mm",
            pointerEvents: "none",
          }}
        >
          <QuotationPrintDocument data={quotationData} />
        </div>
      </div>
    </div>
  );
}
