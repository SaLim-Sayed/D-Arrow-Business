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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  ProductPrice,
  CreateProductPriceDTO,
  UpdateProductPriceDTO,
} from "../types/pricing.types";

const SERVICE_NAME = "PricingService";
const COLLECTION = "prices";

function mapPriceDoc(id: string, data: Record<string, unknown>): ProductPrice {
  return {
    id,
    name: (data.name as string) ?? "",
    nameAr: data.nameAr as string | undefined,
    sku: data.sku as string | undefined,
    description: data.description as string | undefined,
    unitPrice: Number(data.unitPrice ?? 0),
    currency: (data.currency as string) ?? "USD",
    taxRate: data.taxRate != null ? Number(data.taxRate) : undefined,
    status: (data.status as ProductPrice["status"]) ?? "active",
    commercialRegisterRef: data.commercialRegisterRef as string | undefined,
    createdAt: (data.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
  };
}

export const PricingService = {
  async getAll(companyId: string): Promise<ApiResponse<ProductPrice[]>> {
    return withLogging(SERVICE_NAME, "getAll", (async () => {
      const ref = collection(db, "companies", companyId, COLLECTION);
      const q = query(ref, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) =>
        mapPriceDoc(d.id, d.data() as Record<string, unknown>)
      );
      return { data: items, message: "Success" };
    })());
  },

  async create(
    companyId: string,
    data: CreateProductPriceDTO
  ): Promise<ApiResponse<ProductPrice>> {
    return withLogging(SERVICE_NAME, "create", (async () => {
      const ref = collection(db, "companies", companyId, COLLECTION);
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(ref, payload);
      const snap = await getDoc(docRef);
      return {
        data: mapPriceDoc(docRef.id, snap.data() as Record<string, unknown>),
        message: "Created successfully",
      };
    })());
  },

  async update(
    companyId: string,
    id: string,
    data: UpdateProductPriceDTO
  ): Promise<ApiResponse<ProductPrice>> {
    return withLogging(SERVICE_NAME, "update", (async () => {
      const ref = doc(db, "companies", companyId, COLLECTION, id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      const snap = await getDoc(ref);
      return {
        data: mapPriceDoc(id, snap.data() as Record<string, unknown>),
        message: "Updated successfully",
      };
    })());
  },

  async delete(companyId: string, id: string): Promise<ApiResponse<null>> {
    return withLogging(SERVICE_NAME, "delete", (async () => {
      await deleteDoc(doc(db, "companies", companyId, COLLECTION, id));
      return { data: null, message: "Deleted successfully" };
    })());
  },
};
