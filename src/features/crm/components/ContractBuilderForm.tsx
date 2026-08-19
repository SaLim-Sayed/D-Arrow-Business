import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FilePlus,
  FileText,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { selectFieldProps } from "@/components/shared/select-field";
import { useCompanyProfile } from "@/features/companies/hooks/use-company-profile";
import { useContactsQuery } from "../hooks/use-contacts";
import { contactDisplayName } from "../utils/contacts-list.utils";
import { generateQuotationPdf } from "../utils/generate-quotation-pdf";
import { ContractPrintDocument } from "./ContractPrintDocument";
import type {
  ContractClause,
  ContractCompanyInfo,
  ContractFormDraft,
  ContractParty,
  SavedContract,
} from "../types/contract.types";
import {
  createDefaultContractForm,
  formatContractNumber,
  toContractDateIso,
} from "../constants/contract-templates";
import {
  useContractsQuery,
  useCreateContractMutation,
  useDeleteContractMutation,
  useUpdateContractMutation,
  useApproveContractMutation,
} from "../hooks/use-contracts";
import { DocumentApprovalBar } from "@/components/shared/document-approval-bar";
import {
  isDocumentApproved,
  pendingApprovalFields,
} from "@/lib/permissions/document-approval";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const QUICK_FIELD_KEYS = [
  "startDate",
  "durationDays",
  "serviceSummary",
  "imageCount",
  "storeUrl",
  "amountExclVat",
  "vatRate",
  "amountInclVat",
  "extraImagePrice",
] as const;

const MONEY_KEYS = new Set([
  "amountExclVat",
  "vatRate",
  "amountInclVat",
  "extraImagePrice",
]);

const inputClassNames = {
  inputWrapper:
    "bg-white dark:bg-content1 shadow-none border border-default-200 group-data-[focus=true]:border-primary",
};

function buildCompanyInfo(
  profile: ReturnType<typeof useCompanyProfile>["data"]
): ContractCompanyInfo {
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

function StepBadge({
  n,
  done,
  active,
}: {
  n: number;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
        done && "bg-success text-white shadow-sm shadow-success/30",
        active && !done && "bg-primary text-white shadow-sm shadow-primary/30",
        !active && !done && "bg-default-100 text-default-500"
      )}
    >
      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
    </span>
  );
}

function SectionShell({
  step,
  title,
  hint,
  done,
  active,
  children,
  accent = "primary",
}: {
  step: number;
  title: string;
  hint: string;
  done?: boolean;
  active?: boolean;
  children: ReactNode;
  accent?: "primary" | "default" | "success";
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-content1 shadow-sm transition-shadow",
        accent === "primary" && "border-primary/25",
        accent === "success" && "border-success/30",
        accent === "default" && "border-default-200",
        "hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b px-4 py-3.5 sm:px-5",
          accent === "primary" && "border-primary/10 bg-primary/[0.04]",
          accent === "success" && "border-success/10 bg-success/[0.04]",
          accent === "default" && "border-default-100 bg-default-50/80"
        )}
      >
        <StepBadge n={step} done={done} active={active} />
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[15px] font-bold tracking-tight text-default-900">
            {title}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-default-500">
            {hint}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SimplePartyFields({
  party,
  onChange,
  showId = false,
}: {
  party: ContractParty;
  onChange: (next: ContractParty) => void;
  showId?: boolean;
}) {
  const { t } = useTranslation("crm");
  const set = (key: keyof ContractParty, value: string) =>
    onChange({ ...party, [key]: value });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        label={t("contract.party.name")}
        value={party.name}
        onValueChange={(v) => set("name", v)}
        isRequired
        variant="flat"
        classNames={inputClassNames}
      />
      <Input
        label={t("contract.party.representative")}
        value={party.representative || ""}
        onValueChange={(v) => set("representative", v)}
        variant="flat"
        classNames={inputClassNames}
      />
      <Input
        label={t("contract.party.phone")}
        value={party.phone || ""}
        onValueChange={(v) => set("phone", v)}
        dir="ltr"
        variant="flat"
        classNames={inputClassNames}
      />
      <Input
        label={t("contract.party.email")}
        value={party.email || ""}
        onValueChange={(v) => set("email", v)}
        dir="ltr"
        variant="flat"
        classNames={inputClassNames}
      />
      <Input
        label={t("contract.party.cr")}
        value={party.commercialRegister || ""}
        onValueChange={(v) => set("commercialRegister", v)}
        dir="ltr"
        variant="flat"
        classNames={inputClassNames}
      />
      <Input
        label={t("contract.party.vat")}
        value={party.taxNumber || ""}
        onValueChange={(v) => set("taxNumber", v)}
        dir="ltr"
        variant="flat"
        classNames={inputClassNames}
      />
      {showId && (
        <Input
          label={t("contract.party.idNumber")}
          value={party.idNumber || ""}
          onValueChange={(v) => set("idNumber", v)}
          dir="ltr"
          variant="flat"
          classNames={inputClassNames}
        />
      )}
      <Input
        className={showId ? undefined : "sm:col-span-2"}
        label={t("contract.party.address")}
        value={party.address || ""}
        onValueChange={(v) => set("address", v)}
        variant="flat"
        classNames={inputClassNames}
      />
    </div>
  );
}

export function ContractBuilderForm() {
  const { t } = useTranslation("crm");
  const { t: tCommon } = useTranslation("common");
  const { data: profile } = useCompanyProfile();
  const company = useMemo(() => buildCompanyInfo(profile), [profile]);
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ContractFormDraft>(() =>
    createDefaultContractForm()
  );
  const [savedId, setSavedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [providerSynced, setProviderSynced] = useState(false);

  useEffect(() => {
    if (providerSynced || !profile) return;
    setForm((prev) => ({
      ...prev,
      provider: {
        ...prev.provider,
        name: company.nameAr || prev.provider.name,
        commercialRegister:
          company.commercialRegister || prev.provider.commercialRegister,
        taxNumber: company.taxNumber || prev.provider.taxNumber,
        address: company.addressAr || prev.provider.address,
        phone: company.phone || prev.provider.phone,
        email: company.email || prev.provider.email,
      },
    }));
    setProviderSynced(true);
  }, [profile, company, providerSynced]);

  const { data: savedRes, isLoading: loadingSaved } = useContractsQuery();
  const saved = savedRes?.data ?? [];
  const createMutation = useCreateContractMutation();
  const updateMutation = useUpdateContractMutation();
  const deleteMutation = useDeleteContractMutation();
  const approveMutation = useApproveContractMutation();
  const saving = createMutation.isPending || updateMutation.isPending;
  const activeSaved = saved.find((c) => c.id === savedId);
  const actionsUnlocked = isDocumentApproved(activeSaved);

  const patch = (partial: Partial<ContractFormDraft>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const setFieldValue = (key: string, value: string) => {
    setForm((prev) => {
      const fields = prev.fields.map((f) =>
        f.key === key ? { ...f, value } : f
      );
      if (key === "amountExclVat" || key === "vatRate") {
        const excl = Number(
          (key === "amountExclVat"
            ? value
            : fields.find((f) => f.key === "amountExclVat")?.value) || 0
        );
        const rate = Number(
          (key === "vatRate"
            ? value
            : fields.find((f) => f.key === "vatRate")?.value) || 0
        );
        if (Number.isFinite(excl) && Number.isFinite(rate)) {
          const incl = Math.round(excl * (1 + rate / 100) * 100) / 100;
          return {
            ...prev,
            fields: fields.map((f) =>
              f.key === "amountInclVat" ? { ...f, value: String(incl) } : f
            ),
          };
        }
      }
      return { ...prev, fields };
    });
  };

  const fieldValue = (key: string) =>
    form.fields.find((f) => f.key === key)?.value ?? "";

  const fieldLabel = (key: string) =>
    form.fields.find((f) => f.key === key)?.label ?? key;

  const loadContract = (c: SavedContract) => {
    setSavedId(c.id);
    setForm(c.form);
  };

  const resetNew = () => {
    setSavedId(null);
    setForm(
      createDefaultContractForm({
        contractNumber: formatContractNumber(),
        contractDateIso: toContractDateIso(),
        signatureDateIso: toContractDateIso(),
        provider: {
          name: company.nameAr,
          commercialRegister: company.commercialRegister,
          taxNumber: company.taxNumber,
          address: company.addressAr,
          representative: form.provider.representative || "علي المسلم",
          phone: company.phone,
          email: company.email,
        },
      })
    );
  };

  const onSelectContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    patch({
      contactId,
      client: {
        name: contact.accountName || contactDisplayName(contact) || "",
        commercialRegister: contact.commercialRegister || "",
        taxNumber: contact.taxNumber || "",
        address: contact.billingAddress || "",
        representative: contactDisplayName(contact),
        phone: contact.phone || "",
        email: contact.email || "",
        idNumber: "",
      },
    });
    toast.success(t("contract.clientLoaded"));
  };

  const updateClause = (id: string, next: Partial<ContractClause>) => {
    patch({
      clauses: form.clauses.map((c) => (c.id === id ? { ...c, ...next } : c)),
    });
  };

  const addClause = () => {
    patch({
      clauses: [
        ...form.clauses,
        {
          id: uid("cls"),
          title: t("contract.newClause"),
          bullets: [{ id: uid("blt"), text: "" }],
        },
      ],
    });
  };

  const removeClause = (id: string) => {
    patch({ clauses: form.clauses.filter((c) => c.id !== id) });
  };

  const moveClause = (index: number, dir: -1 | 1) => {
    const next = [...form.clauses];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    patch({ clauses: next });
  };

  const addBullet = (clauseId: string) => {
    const clause = form.clauses.find((c) => c.id === clauseId);
    if (!clause) return;
    updateClause(clauseId, {
      bullets: [...clause.bullets, { id: uid("blt"), text: "" }],
    });
  };

  const updateBullet = (clauseId: string, bulletId: string, text: string) => {
    const clause = form.clauses.find((c) => c.id === clauseId);
    if (!clause) return;
    updateClause(clauseId, {
      bullets: clause.bullets.map((b) =>
        b.id === bulletId ? { ...b, text } : b
      ),
    });
  };

  const removeBullet = (clauseId: string, bulletId: string) => {
    const clause = form.clauses.find((c) => c.id === clauseId);
    if (!clause) return;
    updateClause(clauseId, {
      bullets: clause.bullets.filter((b) => b.id !== bulletId),
    });
  };

  const handleSave = async () => {
    if (!form.client.name.trim()) {
      toast.error(t("contract.clientRequired"));
      return;
    }
    const payload = {
      title: `${form.title} — ${form.client.name}`,
      status: "draft" as const,
      form,
      contactId: form.contactId,
      ...pendingApprovalFields(),
    };
    if (savedId) {
      await updateMutation.mutateAsync({ id: savedId, data: payload });
    } else {
      const res = await createMutation.mutateAsync(payload);
      setSavedId(res.data.id);
    }
  };

  const handleDownload = async () => {
    if (!actionsUnlocked) {
      toast.error(tCommon("documentApproval.lockedHint"));
      return;
    }
    if (!form.client.name.trim()) {
      toast.error(t("contract.clientRequired"));
      return;
    }
    if (!printRef.current) return;
    setExporting(true);
    try {
      await generateQuotationPdf(
        printRef.current,
        `contract-${form.contractNumber}.pdf`
      );
      toast.success(t("contract.exportSuccess"));
    } catch {
      toast.error(t("contract.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const clientReady = Boolean(form.client.name.trim());
  const detailsReady =
    Boolean(fieldValue("serviceSummary").trim()) &&
    Boolean(fieldValue("amountInclVat").trim());
  const serviceFields = QUICK_FIELD_KEYS.filter((k) => !MONEY_KEYS.has(k));
  const moneyFields = QUICK_FIELD_KEYS.filter((k) => MONEY_KEYS.has(k));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-default-200/80 bg-content1/90 px-3 py-2.5 shadow-sm backdrop-blur-md sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            color="primary"
            className="font-semibold shadow-sm shadow-primary/25"
            startContent={<Download className="h-4 w-4" />}
            isLoading={exporting}
            isDisabled={!actionsUnlocked}
            onPress={() => void handleDownload()}
          >
            {t("contract.downloadPdf")}
          </Button>
          <Button
            variant="flat"
            startContent={<Save className="h-4 w-4" />}
            isLoading={saving}
            onPress={() => void handleSave()}
          >
            {t("contract.save")}
          </Button>
          <Button
            variant="light"
            startContent={<FilePlus className="h-4 w-4" />}
            onPress={resetNew}
          >
            {t("contract.new")}
          </Button>

          <div className="ms-auto flex min-w-[200px] flex-1 items-center gap-2 sm:max-w-xs">
            <Select
              {...selectFieldProps()}
              size="sm"
              className="flex-1"
              label={t("contract.loadSaved")}
              selectedKeys={savedId ? new Set([savedId]) : new Set()}
              onSelectionChange={(keys) => {
                const id = Array.from(keys)[0] as string | undefined;
                if (!id) return;
                const found = saved.find((c) => c.id === id);
                if (found) loadContract(found);
              }}
              isLoading={loadingSaved}
              classNames={{
                trigger: "bg-white dark:bg-content1 border border-default-200",
              }}
            >
              {saved.map((c) => (
                <SelectItem key={c.id} textValue={c.title}>
                  {c.approvalStatus === "pending"
                    ? `${c.title} · ${tCommon("documentApproval.pending")}`
                    : c.title}
                </SelectItem>
              ))}
            </Select>
            {savedId && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                aria-label={t("contract.delete")}
                onPress={() => {
                  if (!window.confirm(t("contract.deleteConfirm"))) return;
                  void deleteMutation.mutateAsync(savedId).then(resetNew);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <DocumentApprovalBar
        document={activeSaved}
        isSaved={Boolean(savedId)}
        isApproving={approveMutation.isPending}
        onApprove={() => {
          if (savedId) approveMutation.mutate(savedId);
        }}
      />

      {/* Progress rail */}
      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-default-400">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t("contract.progressLabel")}
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              n: 1,
              label: t("contract.stepClient"),
              done: clientReady,
              active: !clientReady,
            },
            {
              n: 2,
              label: t("contract.stepDetails"),
              done: clientReady && detailsReady,
              active: clientReady && !detailsReady,
            },
            {
              n: 3,
              label: t("contract.stepDownload"),
              done: false,
              active: clientReady && detailsReady,
            },
          ].map((s, i, arr) => (
            <li key={s.n} className="relative flex items-center gap-3">
              {i < arr.length - 1 && (
                <span
                  className={cn(
                    "absolute start-4 top-8 hidden h-[calc(100%-1rem)] w-px sm:start-auto sm:top-4 sm:end-[-0.75rem] sm:block sm:h-px sm:w-[calc(100%-2rem)]",
                    s.done ? "bg-success/50" : "bg-default-200"
                  )}
                  aria-hidden
                />
              )}
              <StepBadge n={s.n} done={s.done} active={s.active} />
              <span
                className={cn(
                  "text-sm font-semibold",
                  s.done || s.active ? "text-default-800" : "text-default-400"
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <SectionShell
            step={1}
            title={t("contract.stepClient")}
            hint={t("contract.stepClientHint")}
            done={clientReady}
            active={!clientReady}
            accent="primary"
          >
            <Select
              {...selectFieldProps()}
              label={t("contract.selectContact")}
              placeholder={t("contract.selectContactPlaceholder")}
              selectedKeys={
                form.contactId ? new Set([form.contactId]) : new Set()
              }
              onSelectionChange={(keys) => {
                const id = Array.from(keys)[0] as string | undefined;
                if (id) onSelectContact(id);
              }}
              startContent={<UserRound className="h-4 w-4 text-primary" />}
              classNames={{
                trigger:
                  "bg-white dark:bg-content1 border border-default-200 h-12",
              }}
            >
              {contacts.map((c) => (
                <SelectItem key={c.id} textValue={contactDisplayName(c)}>
                  {contactDisplayName(c)}
                  {c.accountName ? ` — ${c.accountName}` : ""}
                </SelectItem>
              ))}
            </Select>

            <div className="rounded-xl border border-dashed border-default-200 bg-default-50/50 p-3 sm:p-4">
              <SimplePartyFields
                party={form.client}
                onChange={(client) => patch({ client })}
                showId
              />
            </div>
          </SectionShell>

          <SectionShell
            step={2}
            title={t("contract.stepDetails")}
            hint={t("contract.stepDetailsHint")}
            done={clientReady && detailsReady}
            active={clientReady && !detailsReady}
            accent="default"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label={t("contract.title")}
                value={form.title}
                onValueChange={(v) => patch({ title: v })}
                className="sm:col-span-3"
                variant="flat"
                classNames={inputClassNames}
              />
              <Input
                label={t("contract.number")}
                value={form.contractNumber}
                onValueChange={(v) => patch({ contractNumber: v })}
                dir="ltr"
                variant="flat"
                classNames={inputClassNames}
              />
              <Input
                type="date"
                label={t("contract.date")}
                value={form.contractDateIso}
                onValueChange={(v) =>
                  patch({ contractDateIso: v, signatureDateIso: v })
                }
                className="sm:col-span-2"
                variant="flat"
                classNames={inputClassNames}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {serviceFields.map((key) => (
                <Input
                  key={key}
                  label={fieldLabel(key)}
                  value={fieldValue(key)}
                  onValueChange={(v) => setFieldValue(key, v)}
                  className={
                    key === "serviceSummary" || key === "storeUrl"
                      ? "sm:col-span-2"
                      : undefined
                  }
                  dir={
                    key === "storeUrl" ||
                    key === "imageCount" ||
                    key === "durationDays"
                      ? "ltr"
                      : undefined
                  }
                  variant="flat"
                  classNames={inputClassNames}
                />
              ))}
            </div>

            {/* Money group */}
            <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.05] p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                <FileText className="h-3.5 w-3.5" />
                {t("contract.pricingGroup")}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {moneyFields.map((key) => (
                  <Input
                    key={key}
                    label={fieldLabel(key)}
                    value={fieldValue(key)}
                    onValueChange={(v) => setFieldValue(key, v)}
                    dir="ltr"
                    description={
                      key === "amountInclVat"
                        ? t("contract.autoVatHint")
                        : undefined
                    }
                    variant="flat"
                    classNames={{
                      ...inputClassNames,
                      inputWrapper:
                        key === "amountInclVat"
                          ? "bg-white dark:bg-content1 shadow-none border-2 border-primary/40"
                          : inputClassNames.inputWrapper,
                    }}
                  />
                ))}
              </div>
            </div>
          </SectionShell>

          <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1">
            <div className="border-b border-default-100 bg-default-50/80 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-bold text-default-700">
                {t("contract.advancedTitle")}
              </h2>
              <p className="text-xs text-default-500">
                {t("contract.advancedHint")}
              </p>
            </div>
            <Accordion
              selectionMode="multiple"
              className="px-2"
              itemClasses={{
                base: "shadow-none",
                title: "text-sm font-semibold",
                subtitle: "text-xs text-default-500",
                trigger: "py-3",
                content: "pb-4 pt-0",
              }}
            >
              <AccordionItem
                key="provider"
                aria-label={t("contract.provider")}
                title={t("contract.provider")}
                subtitle={t("contract.providerHint")}
              >
                <SimplePartyFields
                  party={form.provider}
                  onChange={(provider) => patch({ provider })}
                />
              </AccordionItem>

              <AccordionItem
                key="preamble"
                aria-label={t("contract.preamble")}
                title={t("contract.preamble")}
                subtitle={t("contract.preambleHint")}
              >
                <Textarea
                  minRows={3}
                  value={form.preamble}
                  onValueChange={(v) => patch({ preamble: v })}
                  variant="flat"
                  classNames={inputClassNames}
                />
              </AccordionItem>

              <AccordionItem
                key="more-fields"
                aria-label={t("contract.moreFields")}
                title={t("contract.moreFields")}
                subtitle={t("contract.moreFieldsHint")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {form.fields
                    .filter(
                      (f) =>
                        !(QUICK_FIELD_KEYS as readonly string[]).includes(f.key)
                    )
                    .map((f) => (
                      <Input
                        key={f.id}
                        label={f.label}
                        value={f.value}
                        onValueChange={(v) => setFieldValue(f.key, v)}
                        variant="flat"
                        classNames={inputClassNames}
                      />
                    ))}
                  <Input
                    label={t("contract.pageCount")}
                    value={form.pageCount}
                    onValueChange={(v) => patch({ pageCount: v })}
                    dir="ltr"
                    variant="flat"
                    classNames={inputClassNames}
                  />
                </div>
              </AccordionItem>

              <AccordionItem
                key="clauses"
                aria-label={t("contract.clauses")}
                title={t("contract.clauses")}
                subtitle={t("contract.clausesEasyHint")}
              >
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={addClause}
                  >
                    {t("contract.addClause")}
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.clauses.map((clause, index) => (
                    <div
                      key={clause.id}
                      className="space-y-2 rounded-xl border border-default-200 bg-default-50/40 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-default-200/80 px-2 text-xs font-bold text-default-700">
                          {index + 1}
                        </span>
                        <Input
                          size="sm"
                          className="min-w-[160px] flex-1"
                          label={t("contract.clauseTitle")}
                          value={clause.title}
                          onValueChange={(v) =>
                            updateClause(clause.id, { title: v })
                          }
                          variant="flat"
                          classNames={inputClassNames}
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t("contract.moveUp")}
                          onPress={() => moveClause(index, -1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t("contract.moveDown")}
                          onPress={() => moveClause(index, 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          aria-label={t("contract.removeClause")}
                          onPress={() => removeClause(clause.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {clause.bullets.map((b) => (
                        <div key={b.id} className="flex items-start gap-2">
                          <Textarea
                            minRows={2}
                            className="flex-1"
                            value={b.text}
                            onValueChange={(v) =>
                              updateBullet(clause.id, b.id, v)
                            }
                            variant="flat"
                            classNames={inputClassNames}
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            aria-label={t("contract.removeBullet")}
                            onPress={() => removeBullet(clause.id, b.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Plus className="h-3.5 w-3.5" />}
                        onPress={() => addBullet(clause.id)}
                      >
                        {t("contract.addBullet")}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            </Accordion>
          </div>

          <SectionShell
            step={3}
            title={t("contract.stepDownload")}
            hint={t("contract.stepDownloadHint")}
            active={clientReady && detailsReady}
            accent="success"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-default-600">
                {form.client.name ? (
                  <span>
                    <span className="font-semibold text-default-800">
                      {form.client.name}
                    </span>
                    {" · "}
                    <span dir="ltr">{form.contractNumber}</span>
                    {" · "}
                    <span dir="ltr">{fieldValue("amountInclVat")}</span>
                  </span>
                ) : (
                  t("contract.clientRequired")
                )}
              </div>
              <Button
                color="success"
                className="font-semibold text-white shadow-sm shadow-success/25"
                startContent={<Download className="h-4 w-4" />}
                isLoading={exporting}
                isDisabled={!actionsUnlocked}
                onPress={() => void handleDownload()}
              >
                {t("contract.downloadPdf")}
              </Button>
            </div>
          </SectionShell>
        </div>

        {/* Paper preview */}
        <aside className="xl:sticky xl:top-[4.5rem] xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-sm">
            <div className="flex items-center justify-between border-b border-default-100 bg-default-50/90 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-default-800">
                  {t("contract.livePreview")}
                </div>
                <div className="text-[11px] text-default-500">
                  {t("contract.livePreviewHint")}
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                A4
              </span>
            </div>
            <div
              className="max-h-[78vh] overflow-auto p-3 sm:p-4"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
                backgroundSize: "14px 14px",
              }}
            >
              <div className="mx-auto w-fit overflow-hidden rounded-sm bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
                <div className="origin-top scale-[0.48] sm:scale-[0.55] xl:scale-[0.52]">
                  <ContractPrintDocument form={form} company={company} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

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
        <ContractPrintDocument form={form} company={company} />
      </div>
    </div>
  );
}
