import type { QuotationRecipientTitle } from "../types/quotation.types";

export const QUOTATION_RECIPIENT_TITLES: QuotationRecipientTitle[] = [
  "mr",
  "mrs",
  "professor",
];

export function recipientTitleLabel(
  title: QuotationRecipientTitle | undefined,
  tPdf: (key: string) => string
): string {
  return tPdf(`recipientTitle.${title ?? "mr"}`);
}
