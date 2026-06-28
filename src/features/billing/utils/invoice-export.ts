import type { Invoice } from "../schemas/invoice";
import { escapeCsvCell } from "./account-tree";

export function downloadInvoicesCsv(
  invoices: Invoice[],
  headers: string[],
  rowBuilder: (invoice: Invoice) => (string | number)[]
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...invoices.map((i) => rowBuilder(i).map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
