import type { Bill } from "../schemas/bill";
import { escapeCsvCell } from "./account-tree";

export function downloadBillsCsv(
  bills: Bill[],
  headers: string[],
  rowBuilder: (bill: Bill) => (string | number)[]
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...bills.map((b) => rowBuilder(b).map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vendor_bills_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
