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
import { mapDocWithTimestamps, stripUndefined } from "../utils/firestore-mappers";
import type { CrmCollectionName } from "../constants/crm-collections";

export interface CrmListOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
}

export function createCrmCollectionService<T extends { id: string }, CreateDTO, UpdateDTO>(
  collectionName: CrmCollectionName,
  serviceName: string,
  defaults?: Partial<CreateDTO>
) {
  const collPath = (companyId: string) =>
    collection(db, "companies", companyId, collectionName);

  return {
    async getAll(
      companyId: string,
      options?: CrmListOptions
    ): Promise<ApiResponse<T[]>> {
      return withLogging(serviceName, "getAll", (async () => {
        const ref = collPath(companyId);
        const q = query(
          ref,
          orderBy(options?.orderByField ?? "createdAt", options?.orderDirection ?? "desc"),
          limit(options?.limitCount ?? 200)
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
