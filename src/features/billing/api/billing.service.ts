import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import { mapDocWithTimestamps, stripUndefined, deepStripUndefined } from "@/features/crm/utils/firestore-mappers";

// Import Schemas
import type { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice";
import type { Bill, CreateBillDTO, UpdateBillDTO } from "../schemas/bill";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "../schemas/account";
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from "../schemas/journal";
import type { Product, CreateProductDTO, UpdateProductDTO, ProductCategory, ProductUnit } from "../schemas/product";
import type { Payment, CreatePaymentDTO } from "../schemas/payment";
import type { BillingSettings } from "../schemas/settings";
import { DEFAULT_BILLING_CURRENCY_ENTRY } from "../utils/billing-currency";
import { DEFAULT_TAXES } from "../data/product-defaults";
import { normalizeBillingSettingsFromFirestore } from "../utils/settings-payload";
import {
  mergeDocumentSequence,
  reserveNextSequenceNumber,
  ensureSequenceNotBehindUsage,
} from "../utils/invoice-sequence";
import type { DocumentSequence } from "../schemas/settings";

// Import Generic Document System
import { GenericDocumentService } from "./generic-document.service";

export interface BillingListOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
}

const DEFAULT_INVOICE_SEQUENCE: DocumentSequence = {
  prefix: "INV-",
  nextNumber: 1,
  padding: 4,
};

function mergeBillingSettingsPatch(
  existing: BillingSettings,
  patch: Partial<BillingSettings>
): BillingSettings {
  const merged: BillingSettings = {
    ...existing,
    ...patch,
    companyProfile: patch.companyProfile
      ? { ...existing.companyProfile, ...patch.companyProfile }
      : existing.companyProfile,
    currencies: patch.currencies ?? existing.currencies,
    taxes: patch.taxes ?? existing.taxes,
    paymentMethods: patch.paymentMethods ?? existing.paymentMethods,
  };

  if (patch.invoiceSequence || existing.invoiceSequence) {
    merged.invoiceSequence = mergeDocumentSequence(
      existing.invoiceSequence,
      patch.invoiceSequence ?? existing.invoiceSequence ?? DEFAULT_INVOICE_SEQUENCE
    );
  }

  for (const key of ["quotationSequence", "estimateSequence", "proposalSequence"] as const) {
    if (patch[key] || existing[key]) {
      merged[key] = mergeDocumentSequence(
        existing[key],
        patch[key] ?? existing[key]!
      );
    }
  }

  return merged;
}

async function listUsedInvoiceNumbers(companyId: string): Promise<string[]> {
  const ref = collection(db, "companies", companyId, "invoices");
  const snapshot = await getDocs(query(ref, limit(500)));
  return snapshot.docs
    .map((d) => (d.data() as Invoice).invoiceNumber)
    .filter((n): n is string => !!n && n !== "DRAFT");
}

export function createBillingCollectionService<T extends { id?: string }, CreateDTO, UpdateDTO>(
  collectionName: string,
  serviceName: string,
  defaults?: Partial<CreateDTO>
) {
  const collPath = (companyId: string) =>
    collection(db, "companies", companyId, collectionName);

  return {
    async getAll(
      companyId: string,
      options?: BillingListOptions
    ): Promise<ApiResponse<T[]>> {
      return withLogging(serviceName, "getAll", (async () => {
        const ref = collPath(companyId);
        const q = query(
          ref,
          orderBy(options?.orderByField ?? "createdAt", options?.orderDirection ?? "desc"),
          limit(options?.limitCount ?? 500)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((docSnap) =>
          mapDocWithTimestamps<T>(docSnap.id, docSnap.data() as Record<string, unknown>)
        );
        return { data: items, message: "Success" };
      })());
    },

    async getById(companyId: string, id: string): Promise<ApiResponse<T>> {
      return withLogging(serviceName, "getById", (async () => {
        const docSnap = await getDoc(doc(db, "companies", companyId, collectionName, id));
        if (!docSnap.exists()) throw new Error(`${serviceName}: not found`);
        return {
          data: mapDocWithTimestamps<T>(docSnap.id, docSnap.data() as Record<string, unknown>),
          message: "Success",
        };
      })());
    },

    async create(companyId: string, data: CreateDTO): Promise<ApiResponse<T>> {
      return withLogging(serviceName, "create", (async () => {
        const payload = stripUndefined({
          ...defaults,
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        const docRef = await addDoc(collPath(companyId), payload);
        const newDoc = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<T>(newDoc.id, newDoc.data() as Record<string, unknown>),
          message: "Created successfully",
        };
      })());
    },

    async update(companyId: string, id: string, data: UpdateDTO): Promise<ApiResponse<T>> {
      return withLogging(serviceName, "update", (async () => {
        const docRef = doc(db, "companies", companyId, collectionName, id);
        const clean = stripUndefined({ ...data, updatedAt: serverTimestamp() } as Record<string, unknown>);
        await updateDoc(docRef, clean);
        const updated = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<T>(updated.id, updated.data() as Record<string, unknown>),
          message: "Updated successfully",
        };
      })());
    },

    async delete(companyId: string, id: string): Promise<void> {
      return withLogging(serviceName, "delete", (async () => {
        await deleteDoc(doc(db, "companies", companyId, collectionName, id));
      })());
    },
  };
}

export const BillingService = {
  invoices: createBillingCollectionService<Invoice, CreateInvoiceDTO, UpdateInvoiceDTO>("invoices", "InvoiceService"),
  bills: createBillingCollectionService<Bill, CreateBillDTO, UpdateBillDTO>("bills", "BillService"),
  accounts: createBillingCollectionService<Account, CreateAccountDTO, UpdateAccountDTO>("accounts", "AccountService"),
  journals: createBillingCollectionService<JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO>("journals", "JournalService"),
  products: createBillingCollectionService<Product, CreateProductDTO, UpdateProductDTO>("products", "ProductService"),
  productCategories: createBillingCollectionService<ProductCategory, Partial<ProductCategory>, Partial<ProductCategory>>("product_categories", "ProductCategoryService"),
  productUnits: createBillingCollectionService<ProductUnit, Partial<ProductUnit>, Partial<ProductUnit>>("product_units", "ProductUnitService"),
  payments: createBillingCollectionService<Payment, CreatePaymentDTO, Partial<CreatePaymentDTO>>("payments", "PaymentService"),
  
  // Generic Document System
  documents: GenericDocumentService,

  async reserveInvoiceNumber(companyId: string): Promise<string> {
    const usedNumbers = await listUsedInvoiceNumbers(companyId);
    const docRef = doc(db, "companies", companyId, "settings", "billing");

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const settings = snap.exists()
        ? (snap.data() as BillingSettings)
        : null;
      const seq =
        settings?.invoiceSequence ?? { ...DEFAULT_INVOICE_SEQUENCE };

      const { number, nextSequence } = reserveNextSequenceNumber(seq, usedNumbers);

      tx.set(
        docRef,
        {
          invoiceSequence: nextSequence,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return number;
    });
  },

  async reserveDocumentNumber(companyId: string, documentType: "invoice" | "quotation" | "estimate" | "proposal"): Promise<string> {
    const sequenceKey = `${documentType}Sequence` as keyof BillingSettings;
    const docRef = doc(db, "companies", companyId, "settings", "billing");

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const settings = snap.exists()
        ? (snap.data() as BillingSettings)
        : null;
      const defaultSeq = {
        prefix: `${documentType.toUpperCase().slice(0, 3)}-`,
        nextNumber: 1,
        padding: 4,
      };
      const seq = (settings?.[sequenceKey] as DocumentSequence | undefined) ?? defaultSeq;

      const { formatSequenceNumber } = await import("../utils/invoice-sequence");
      let nextNum = Math.max(1, Number(seq.nextNumber) || 1);
      let documentNumber = formatSequenceNumber({ ...seq, nextNumber: nextNum });

      tx.set(
        docRef,
        {
          [sequenceKey]: { ...seq, nextNumber: nextNum + 1 },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return documentNumber;
    });
  },

  async postJournalWithBalances(
    companyId: string,
    journal: CreateJournalEntryDTO
  ): Promise<JournalEntry> {
    const { aggregateBalanceDeltas } = await import("../utils/accounting-engine");
    const accountsRes = await BillingService.accounts.getAll(companyId);
    const deltas = aggregateBalanceDeltas(accountsRes.data, journal.lines);

    const journalRes = await BillingService.journals.create(companyId, journal);

    await Promise.all(
      Array.from(deltas.entries()).map(async ([accountId, delta]) => {
        const account = accountsRes.data.find((a) => a.id === accountId);
        if (!account) return;
        await BillingService.accounts.update(companyId, accountId, {
          currentBalance: (account.currentBalance ?? 0) + delta,
        });
      })
    );

    return journalRes.data;
  },
  
  
  settings: {
    async get(companyId: string): Promise<ApiResponse<BillingSettings>> {
      return withLogging("BillingSettingsService", "get", (async () => {
        const docSnap = await getDoc(doc(db, "companies", companyId, "settings", "billing"));
        if (!docSnap.exists()) {
          // Return some defaults if not set
          return {
            data: normalizeBillingSettingsFromFirestore({
              companyProfile: { name: "", address: "", email: "" },
              currencies: [{ ...DEFAULT_BILLING_CURRENCY_ENTRY }],
              taxes: DEFAULT_TAXES,
              paymentMethods: [],
              invoiceSequence: { prefix: "INV-", nextNumber: 1, padding: 4 },
              quotationSequence: { prefix: "QUO-", nextNumber: 1, padding: 4 },
              estimateSequence: { prefix: "EST-", nextNumber: 1, padding: 4 },
              proposalSequence: { prefix: "PRP-", nextNumber: 1, padding: 4 },
            } as BillingSettings),
            message: "Defaults returned"
          };
        }
        const data = docSnap.data() as BillingSettings;
        let normalized = normalizeBillingSettingsFromFirestore({
          ...data,
          taxes: data.taxes?.length ? data.taxes : DEFAULT_TAXES,
        });
        const usedNumbers = await listUsedInvoiceNumbers(companyId);
        const syncedSeq = ensureSequenceNotBehindUsage(
          normalized.invoiceSequence ?? DEFAULT_INVOICE_SEQUENCE,
          usedNumbers
        );
        if (syncedSeq.nextNumber !== normalized.invoiceSequence?.nextNumber) {
          const docRef = doc(db, "companies", companyId, "settings", "billing");
          const { setDoc } = await import("firebase/firestore");
          await setDoc(
            docRef,
            { invoiceSequence: syncedSeq, updatedAt: serverTimestamp() },
            { merge: true }
          );
          normalized = { ...normalized, invoiceSequence: syncedSeq };
        }
        return {
          data: normalized,
          message: "Success",
        };
      })());
    },
    async update(companyId: string, data: Partial<BillingSettings>): Promise<ApiResponse<BillingSettings>> {
      return withLogging("BillingSettingsService", "update", (async () => {
        const docRef = doc(db, "companies", companyId, "settings", "billing");
        const existing = (await BillingService.settings.get(companyId)).data;
        const merged = mergeBillingSettingsPatch(existing, data);
        const normalized = normalizeBillingSettingsFromFirestore(merged);
        const clean = deepStripUndefined({
          ...normalized,
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        const { setDoc } = await import("firebase/firestore");
        await setDoc(docRef, clean, { merge: true });
        const updated = await getDoc(docRef);
        return {
          data: normalizeBillingSettingsFromFirestore(updated.data() as BillingSettings),
          message: "Updated successfully",
        };
      })());
    }
  }
};
