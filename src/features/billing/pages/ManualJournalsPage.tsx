import { useState, useRef } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  useDisclosure,
} from "@heroui/react";
import { Plus, Search, FileText, Edit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { useJournals } from "../hooks/use-journals";
import { formatCurrency } from "@/lib/utils";
import { JournalFormModal } from "../components/JournalFormModal";
import { JournalPrintView } from "../components/JournalPrintView";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import type { JournalEntry } from "../schemas/journal";

export default function ManualJournalsPage() {
  const { t } = useTranslation("billing");
  const { data: journals = [], isLoading } = useJournals();
  const [search, setSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [printingJournal, setPrintingJournal] = useState<JournalEntry | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredJournals = journals.filter((j) =>
    j.journalNumber.toLowerCase().includes(search.toLowerCase()) ||
    j.reference?.toLowerCase().includes(search.toLowerCase())
  );

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
    // Give react time to render the print view with the data
    setTimeout(async () => {
      if (printRef.current) {
        try {
          await generateQuotationPdf(printRef.current, `Journal-${journal.journalNumber}.pdf`);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        } finally {
          setPrintingJournal(null);
        }
      }
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("journals.title") || "Manual Journals"}
        description={t("journals.description") || "Record manual journal entries for double-entry accounting."}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleCreate}
          >
            {t("journals.add") || "New Journal"}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder={t("journals.search") || "Search by journal number or reference..."}
          value={search}
          onValueChange={setSearch}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      <Table aria-label="Journals table" className="mt-4">
        <TableHeader>
          <TableColumn>{t("journals.columns.date")}</TableColumn>
          <TableColumn>{t("journals.columns.journal_number")}</TableColumn>
          <TableColumn>{t("journals.columns.reference")}</TableColumn>
          <TableColumn>{t("journals.columns.notes")}</TableColumn>
          <TableColumn>{t("journals.columns.amount")}</TableColumn>
          <TableColumn>{t("journals.columns.status")}</TableColumn>
          <TableColumn align="end">{t("journals.columns.actions")}</TableColumn>
        </TableHeader>
        <TableBody items={filteredJournals} isLoading={isLoading}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.date.toLocaleDateString()}</TableCell>
              <TableCell>
                <span className="font-semibold text-primary">{item.journalNumber}</span>
              </TableCell>
              <TableCell>{item.reference || "—"}</TableCell>
              <TableCell>
                <span className="text-default-500 truncate max-w-[200px] block">
                  {item.notes || "—"}
                </span>
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(item.totalDebit, item.currency)}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={item.status === "published" ? "success" : "default"}>
                  {item.status.toUpperCase()}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    onPress={() => handleDownload(item)}
                    isLoading={printingJournal?.id === item.id}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Render the modal for Creating/Editing */}
      <JournalFormModal 
        isOpen={isOpen} 
        onClose={onClose} 
        journalToEdit={selectedJournal} 
      />

      {/* Hidden printable view for the PDF generation */}
      {printingJournal && (
        <JournalPrintView ref={printRef} journal={printingJournal} />
      )}
    </div>
  );
}
