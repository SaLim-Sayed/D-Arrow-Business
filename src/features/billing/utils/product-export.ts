import type { Product } from "../schemas/product";
import { escapeCsvCell } from "./account-tree";

export function downloadProductsCsv(
  products: Product[],
  headers: string[],
  rowBuilder: (product: Product) => (string | number)[]
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...products.map((p) => rowBuilder(p).map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
