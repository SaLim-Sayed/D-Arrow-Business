import type { JournalEntry } from "../schemas/journal";
import { escapeCsvCell } from "./account-tree";

export function downloadJournalsCsv(
  journals: JournalEntry[],
  headers: string[],
  rowBuilder: (journal: JournalEntry) => (string | number)[]
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...journals.map((j) => rowBuilder(j).map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `journal_entries_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
