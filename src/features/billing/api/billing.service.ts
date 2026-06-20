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
import type { BillingSettings } from "../schemas/settings";

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
              taxes: [],
              paymentMethods: [],
              invoiceSequence: { prefix: "INV-", nextNumber: 1, padding: 4 }
            } as BillingSettings,
            message: "Defaults returned"
          };
        }
        return {
          data: docSnap.data() as BillingSettings,
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
