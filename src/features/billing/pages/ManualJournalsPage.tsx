import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  ChevronRight,
  Download,
  Edit2,
  FileText,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useJournals } from "../hooks/use-journals";
import { JournalFormModal } from "../components/JournalFormModal";
import { JournalPrintView } from "../components/JournalPrintView";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import type { JournalEntry } from "../schemas/journal";
import { downloadJournalsCsv } from "../utils/journal-export";

type StatusFilter = "all" | JournalEntry["status"];
type SourceFilter = "all" | JournalEntry["sourceType"];

const STATUS_ORDER: JournalEntry["status"][] = ["draft", "posted", "cancelled"];
const SOURCE_ORDER: JournalEntry["sourceType"][] = [
  "manual",
  "invoice",
  "bill",
  "payment",
  "refund",
];

function statusColor(status: JournalEntry["status"]) {
  if (status === "posted") return "bg-success/10 text-success";
  if (status === "cancelled") return "bg-danger/10 text-danger";
  return "bg-warning/10 text-warning-700 dark:text-warning";
}

function JournalRow({
  journal,
  selected,
  onToggle,
  onEdit,
  onDownload,
  isDownloading,
  t,
  locale,
}: {
  journal: JournalEntry;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
  locale: string;
}) {
  const dateLocale = locale.startsWith("ar") ? "ar-SA" : undefined;

  return (
    <tr
      className={cn(
        "border-b border-default-100 text-sm transition-colors hover:bg-primary/[0.03]",
        selected && "bg-primary/[0.06]"
      )}
    >
      <td className="w-10 px-3 py-2">
        <Checkbox
          size="sm"
          isSelected={selected}
          onValueChange={onToggle}
          aria-label={journal.journalNumber}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-default-600">
        {journal.date.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <button
          type="button"
          onClick={onEdit}
          className="font-mono font-semibold text-primary hover:underline"
          dir="ltr"
        >
          {journal.journalNumber}
        </button>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 md:table-cell">
        {journal.reference ? (
          <span className="font-mono text-default-600" dir="ltr">
            {journal.reference}
          </span>
        ) : (
          <span className="text-default-300">—</span>
        )}
      </td>
      <td className="hidden max-w-[240px] truncate px-3 py-2 text-default-500 lg:table-cell">
        {journal.notes || "—"}
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <span className="inline-block rounded bg-default-100 px-1.5 py-0.5 text-xs text-default-600">
          {t(`journals.source.${journal.sourceType}`)}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span className="tabular-nums font-medium text-default-900" dir="ltr">
          {formatCurrency(journal.totalDebit, journal.currency)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
            statusColor(journal.status)
          )}
        >
          {t(`journals.status.${journal.status}`)}
        </span>
      </td>
      <td className="w-20 px-2 py-2">
        <div className="flex justify-end gap-0.5">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("journals.edit")}
            onPress={onEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("journals.download_pdf")}
            onPress={onDownload}
            isLoading={isDownloading}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ManualJournalsPage() {
  const { t, i18n } = useTranslation("billing");
  const { data: journals = [], isLoading } = useJournals();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(
    null
  );
  const [printingJournal, setPrintingJournal] = useState<JournalEntry | null>(
    null
  );
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return journals.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (sourceFilter !== "all" && j.sourceType !== sourceFilter) return false;
      if (!q) return true;
      return (
        j.journalNumber.toLowerCase().includes(q) ||
        j.reference?.toLowerCase().includes(q) ||
        j.notes?.toLowerCase().includes(q)
      );
    });
  }, [journals, search, statusFilter, sourceFilter]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((j) => j.id && selectedIds.has(j.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else
      setSelectedIds(new Set(filtered.map((j) => j.id!).filter(Boolean)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    setSelectedJournal(null);
    onOpen();
  };

  const handleEdit = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    onOpen();
  };

  const handleDownload = async (journal: JournalEntry) => {
    setPrintingJournal(journal);
    setTimeout(async () => {
      if (printRef.current) {
        try {
          await generateQuotationPdf(
            printRef.current,
            `Journal-${journal.journalNumber}.pdf`
          );
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        } finally {
          setPrintingJournal(null);
        }
      }
    }, 300);
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0
        ? filtered.filter((j) => j.id && selectedIds.has(j.id))
        : filtered;

    if (toExport.length === 0) {
      toast.error(t("journals.export_empty"));
      return;
    }

    const dateLocale = i18n.language.startsWith("ar") ? "ar-SA" : undefined;

    downloadJournalsCsv(
      toExport,
      [
        t("journals.columns.date"),
        t("journals.columns.journal_number"),
        t("journals.columns.reference"),
        t("journals.columns.notes"),
        t("journals.columns.source"),
        t("journals.columns.amount"),
        t("journals.columns.status"),
      ],
      (j) => [
        j.date.toLocaleDateString(dateLocale),
        j.journalNumber,
        j.reference ?? "",
        j.notes ?? "",
        t(`journals.source.${j.sourceType}`),
        j.totalDebit,
        t(`journals.status.${j.status}`),
      ]
    );
    toast.success(t("journals.export_success"));
  };

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("journals.filters.all") },
    ...STATUS_ORDER.map((status) => ({
      key: status as StatusFilter,
      label: t(`journals.status.${status}`),
    })),
  ];

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{t("journals.title")}</span>
      </nav>

      <p className="mb-3 text-sm text-default-500">{t("journals.description")}</p>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="border-b border-default-200 bg-default-50/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              size="sm"
              color="primary"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleCreate}
            >
              {t("journals.add")}
            </Button>

            <Button
              size="sm"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExport}
            >
              {t("journals.export")}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-default-200 sm:block" />

            <Input
              size="sm"
              variant="flat"
              className="min-w-[200px] flex-1 max-w-xl"
              placeholder={t("journals.search")}
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              classNames={{
                inputWrapper:
                  "bg-white dark:bg-content1 shadow-none border border-default-200",
              }}
            />

            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  {t("journals.filters.status")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("journals.filters.status")}
                selectedKeys={new Set([statusFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as StatusFilter;
                  if (key) setStatusFilter(key);
                }}
              >
                {statusChips.map(({ key, label }) => (
                  <DropdownItem key={key}>{label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat">
                  {t("journals.filters.source")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("journals.filters.source")}
                selectedKeys={new Set([sourceFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as SourceFilter;
                  if (key) setSourceFilter(key);
                }}
                items={[
                  { key: "all" as const, label: t("journals.filters.all") },
                  ...SOURCE_ORDER.map((source) => ({
                    key: source,
                    label: t(`journals.source.${source}`),
                  })),
                ]}
              >
                {(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-default-100 px-3 py-1.5">
            {statusChips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === key
                    ? "bg-primary text-white"
                    : "bg-white text-default-600 hover:bg-default-100 dark:bg-content1"
                )}
              >
                {label}
              </button>
            ))}
            <span className="ms-auto text-xs text-default-400">
              {t("journals.entryCount", { count: filtered.length })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner color="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              {t("journals.empty")}
            </div>
          ) : (
            <table className="w-full min-w-[880px] border-collapse text-start">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      size="sm"
                      isSelected={allSelected}
                      onValueChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("journals.columns.date")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("journals.columns.journal_number")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                    {t("journals.columns.reference")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">
                    {t("journals.columns.notes")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                    {t("journals.columns.source")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("journals.columns.amount")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("journals.columns.status")}
                  </th>
                  <th className="w-20 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((journal) => (
                  <JournalRow
                    key={journal.id}
                    journal={journal}
                    selected={!!journal.id && selectedIds.has(journal.id)}
                    onToggle={() => journal.id && toggleOne(journal.id)}
                    onEdit={() => handleEdit(journal)}
                    onDownload={() => handleDownload(journal)}
                    isDownloading={printingJournal?.id === journal.id}
                    t={t}
                    locale={i18n.language}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-default-200 bg-default-50/50 px-4 py-2 text-xs text-default-500">
          <span>
            {selectedIds.size > 0
              ? t("journals.selectedCount", { count: selectedIds.size })
              : t("journals.entryCount", { count: filtered.length })}
          </span>
          <span>1 / 1</span>
        </div>
      </div>

      <JournalFormModal
        isOpen={isOpen}
        onClose={onClose}
        journalToEdit={selectedJournal}
      />

      {printingJournal && (
        <JournalPrintView ref={printRef} journal={printingJournal} />
      )}
    </div>
  );
}
