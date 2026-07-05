import type { DocumentSequence, InvoiceSequence } from "../schemas/settings";

export function formatSequenceNumber(seq: InvoiceSequence): string {
  const padding = Math.max(1, Number(seq.padding) || 4);
  const nextNumber = Math.max(1, Number(seq.nextNumber) || 1);
  const padded = String(nextNumber).padStart(padding, "0");
  return `${seq.prefix ?? ""}${padded}${seq.suffix ?? ""}`;
}

/** Parse numeric suffix from a document number matching the sequence pattern. */
export function parseSequenceNumber(
  documentNumber: string,
  seq: Pick<DocumentSequence, "prefix" | "suffix">
): number | null {
  const prefix = seq.prefix ?? "";
  const suffix = seq.suffix ?? "";
  if (!documentNumber || documentNumber === "DRAFT") return null;
  if (prefix && !documentNumber.startsWith(prefix)) return null;

  let rest = prefix ? documentNumber.slice(prefix.length) : documentNumber;
  if (suffix && rest.endsWith(suffix)) {
    rest = rest.slice(0, -suffix.length);
  }

  if (!/^\d+$/.test(rest)) return null;
  const n = parseInt(rest, 10);
  return Number.isFinite(n) ? n : null;
}

export function getMaxSequenceUsed(
  documentNumbers: string[],
  seq: DocumentSequence
): number {
  let max = 0;
  for (const num of documentNumbers) {
    const parsed = parseSequenceNumber(num, seq);
    if (parsed !== null) max = Math.max(max, parsed);
  }
  return max;
}

/** Ensure the counter is not behind numbers already issued. */
export function ensureSequenceNotBehindUsage(
  seq: DocumentSequence,
  documentNumbers: string[]
): DocumentSequence {
  const maxUsed = getMaxSequenceUsed(documentNumbers, seq);
  const storedNext = Math.max(1, Number(seq.nextNumber) || 1);
  const safeNext = Math.max(storedNext, maxUsed + 1);
  return { ...seq, nextNumber: safeNext };
}

/**
 * Merge sequence settings — never decrease nextNumber (prevents stale form saves
 * from resetting the counter after invoices were posted).
 */
export function mergeDocumentSequence(
  existing: DocumentSequence | undefined,
  incoming: DocumentSequence
): DocumentSequence {
  const existingNext = Math.max(1, Number(existing?.nextNumber) || 1);
  const incomingNext = Math.max(1, Number(incoming.nextNumber) || 1);
  return {
    prefix: incoming.prefix ?? existing?.prefix ?? "DOC-",
    padding: Math.max(1, Number(incoming.padding) || Number(existing?.padding) || 4),
    suffix: incoming.suffix ?? existing?.suffix,
    nextNumber: Math.max(existingNext, incomingNext),
  };
}

/** Reserve the next free number, skipping any collision with existing documents. */
export function reserveNextSequenceNumber(
  seq: DocumentSequence,
  usedNumbers: string[]
): { number: string; nextSequence: DocumentSequence } {
  const synced = ensureSequenceNotBehindUsage(seq, usedNumbers);
  let nextNum = synced.nextNumber;
  let number = formatSequenceNumber({ ...synced, nextNumber: nextNum });

  while (usedNumbers.includes(number)) {
    nextNum += 1;
    number = formatSequenceNumber({ ...synced, nextNumber: nextNum });
  }

  return {
    number,
    nextSequence: { ...synced, nextNumber: nextNum + 1 },
  };
}
