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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import { mapDocWithTimestamps, stripUndefined } from "@/features/crm/utils/firestore-mappers";

// Import Schemas
import type { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice";
import type { Bill, CreateBillDTO, UpdateBillDTO } from "../schemas/bill";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "../schemas/account";
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from "../schemas/journal";
import type { Product, CreateProductDTO, UpdateProductDTO, ProductCategory, ProductUnit } from "../schemas/product";
import type { Payment, CreatePaymentDTO } from "../schemas/payment";
import type { BillingSettings } from "../schemas/settings";
import { DEFAULT_TAXES } from "../data/product-defaults";

// Import Generic Document System
import { GenericDocumentService } from "./generic-document.service";

export interface BillingListOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
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
    const settingsRes = await BillingService.settings.get(companyId);
    const seq = settingsRes.data.invoiceSequence;
    const { formatSequenceNumber } = await import("../utils/accounting-engine");
    const invoiceNumber = formatSequenceNumber(seq);
    await BillingService.settings.update(companyId, {
      invoiceSequence: { ...seq, nextNumber: seq.nextNumber + 1 },
    });
    return invoiceNumber;
  },

  async reserveDocumentNumber(companyId: string, documentType: "invoice" | "quotation" | "estimate" | "proposal"): Promise<string> {
    const settingsRes = await BillingService.settings.get(companyId);
    const sequenceKey = `${documentType}Sequence` as keyof BillingSettings;
    const seq = settingsRes.data[sequenceKey] as any || { prefix: `${documentType.toUpperCase()}-`, nextNumber: 1, padding: 4 };
    
    const { formatSequenceNumber } = await import("../utils/accounting-engine");
    const documentNumber = formatSequenceNumber(seq);
    
    await BillingService.settings.update(companyId, {
      [sequenceKey]: { ...seq, nextNumber: seq.nextNumber + 1 },
    } as Partial<BillingSettings>);
    
    return documentNumber;
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
            data: {
              companyProfile: { name: "", address: "", email: "" },
              currencies: [{ code: "USD", symbol: "$", name: "US Dollar", isDefault: true }],
              taxes: DEFAULT_TAXES,
              paymentMethods: [],
              invoiceSequence: { prefix: "INV-", nextNumber: 1, padding: 4 },
              quotationSequence: { prefix: "QUO-", nextNumber: 1, padding: 4 },
              estimateSequence: { prefix: "EST-", nextNumber: 1, padding: 4 },
              proposalSequence: { prefix: "PRP-", nextNumber: 1, padding: 4 },
            } as BillingSettings,
            message: "Defaults returned"
          };
        }
        const data = docSnap.data() as BillingSettings;
        return {
          data: {
            ...data,
            taxes: data.taxes?.length ? data.taxes : DEFAULT_TAXES,
          },
          message: "Success",
        };
      })());
    },
    async update(companyId: string, data: Partial<BillingSettings>): Promise<ApiResponse<BillingSettings>> {
      return withLogging("BillingSettingsService", "update", (async () => {
        const docRef = doc(db, "companies", companyId, "settings", "billing");
        const clean = stripUndefined({ ...data, updatedAt: serverTimestamp() } as Record<string, unknown>);
        // Use setDoc with merge: true to avoid overwriting unrelated settings
        const { setDoc } = await import("firebase/firestore");
        await setDoc(docRef, clean, { merge: true });
        const updated = await getDoc(docRef);
        return {
          data: updated.data() as BillingSettings,
          message: "Updated successfully",
        };
      })());
    }
  }
};
