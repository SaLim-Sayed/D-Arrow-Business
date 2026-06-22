import {
  Button,
  Input,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { NativeDateInput } from "@/components/shared/native-date-input";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { selectFieldProps } from "@/components/shared/select-field";
import { useAccounts } from "../hooks/use-accounts";
import {
  useCreateJournalMutation,
  useUpdateJournalMutation,
} from "../hooks/use-journals";
import type {
  CreateJournalEntryDTO,
  JournalEntry,
  JournalLine,
} from "../schemas/journal";

interface JournalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalToEdit?: JournalEntry | null;
}

export function JournalFormModal({
  isOpen,
  onClose,
  journalToEdit,
}: JournalFormModalProps) {
  const { t } = useTranslation("billing");
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateJournalMutation();
  const updateMutation = useUpdateJournalMutation();

  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [journalNumber, setJournalNumber] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" },
  ]);

  useEffect(() => {
    if (journalToEdit) {
      setDate(journalToEdit.date.toISOString().split("T")[0]);
      setJournalNumber(journalToEdit.journalNumber);
      setReference(journalToEdit.reference || "");
      setNotes(journalToEdit.notes || "");
      setLines(journalToEdit.lines || []);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setJournalNumber(`JRN-${Math.floor(Math.random() * 10000)}`);
      setReference("");
      setNotes("");
      setLines([
        { accountId: "", debit: 0, credit: 0, description: "" },
        { accountId: "", debit: 0, credit: 0, description: "" },
      ]);
    }
  }, [journalToEdit, isOpen]);

  const addLine = () => {
    setLines([
      ...lines,
      { accountId: "", debit: 0, credit: 0, description: "" },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // If setting debit > 0, clear credit
    if (field === "debit" && Number(value) > 0) {
      newLines[index].credit = 0;
    }
    // If setting credit > 0, clear debit
    if (field === "credit" && Number(value) > 0) {
      newLines[index].debit = 0;
    }

    setLines(newLines);
  };

  const totalDebit = lines.reduce(
    (sum, line) => sum + (Number(line.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (sum, line) => sum + (Number(line.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const isReady =
    isBalanced && totalDebit > 0 && lines.every((l) => l.accountId);

  const handleSubmit = async () => {
    if (!isReady) return;

    const payload: CreateJournalEntryDTO = {
      date: new Date(date),
      journalNumber,
      reference,
      notes,
      lines: lines.map((l) => ({
        ...l,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      })),
      totalDebit,
      totalCredit,
      currency: "USD",
      status: "published",
      sourceType: "manual",
    };

    try {
      if (journalToEdit?.id) {
        await updateMutation.mutateAsync({
          id: journalToEdit.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save journal:", error);
      // Here you might want to show a toast
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      placement={t("dir", { defaultValue: "ltr" }) === "rtl" ? "right" : "right"}
      scrollBehavior="inside"
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {journalToEdit
                ? t("journals.edit", "Edit Journal")
                : t("journals.add")}
            </DrawerHeader>
            <DrawerBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label={t("journals.columns.journal_number")}
                  value={journalNumber}
                  onValueChange={setJournalNumber}
                  variant="bordered"
                  isRequired
                />
                <NativeDateInput
                  label={t("journals.columns.date")}
                  value={date}
                  onValueChange={setDate}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label={t("journals.columns.reference")}
                  value={reference}
                  onValueChange={setReference}
                  variant="bordered"
                />
                <Input
                  label={t("journals.columns.notes")}
                  value={notes}
                  onValueChange={setNotes}
                  variant="bordered"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table aria-label="Journal lines">
                  <TableHeader>
                    <TableColumn>ACCOUNT</TableColumn>
                    <TableColumn>DESCRIPTION</TableColumn>
                    <TableColumn>DEBIT</TableColumn>
                    <TableColumn>CREDIT</TableColumn>
                    <TableColumn width={50}>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            {...selectFieldProps({ compact: true })}
                            placeholder="Select Account"
                            selectedKeys={
                              line.accountId ? new Set([line.accountId]) : new Set()
                            }
                            onSelectionChange={(keys) => {
                              const val = Array.from(keys)[0] as string;
                              updateLine(index, "accountId", val || "");
                            }}
                            aria-label="Select Account"
                            size="sm"
                          >
                            {accounts.map((acc) => (
                              <SelectItem 
                                key={acc.id!} 
                                textValue={`${acc.code} - ${acc.name}`}
                              >
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            size="sm"
                            value={line.description || ""}
                            onValueChange={(val) =>
                              updateLine(index, "description", val)
                            }
                            placeholder="Line description"
                            aria-label="Line description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            size="sm"
                            value={line.debit?.toString() || "0"}
                            onValueChange={(val) =>
                              updateLine(index, "debit", val)
                            }
                            aria-label="Debit"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            size="sm"
                            value={line.credit?.toString() || "0"}
                            onValueChange={(val) =>
                              updateLine(index, "credit", val)
                            }
                            aria-label="Credit"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => removeLine(index)}
                            isDisabled={lines.length <= 2}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={addLine}
                  startContent={<Plus className="w-4 h-4" />}
                >
                  Add Line
                </Button>

                <div className="flex gap-4 text-sm">
                  <div
                    className={`font-semibold ${!isBalanced ? "text-danger" : "text-success"}`}
                  >
                    Total Debit: {totalDebit.toFixed(2)}
                  </div>
                  <div
                    className={`font-semibold ${!isBalanced ? "text-danger" : "text-success"}`}
                  >
                    Total Credit: {totalCredit.toFixed(2)}
                  </div>
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isDisabled={!isReady}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                Save Journal
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
