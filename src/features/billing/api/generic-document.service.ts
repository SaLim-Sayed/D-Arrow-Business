import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import { mapDocWithTimestamps, stripUndefined } from "@/features/crm/utils/firestore-mappers";
import type {
  GenericDocument,
  CreateGenericDocumentDTO,
  UpdateGenericDocumentDTO,
  DocumentType,
  EntityType,
} from "../schemas/generic-document";

export interface GenericDocumentListOptions {
  documentType?: DocumentType;
  entityType?: EntityType;
  entityId?: string;
  status?: string;
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
}

/**
 * Generic document service that can handle all document types
 * (invoices, quotations, estimates, proposals, etc.)
 */
export function createGenericDocumentService() {
  const collPath = (companyId: string) =>
    collection(db, "companies", companyId, "documents");

  return {
    async getAll(
      companyId: string,
      options?: GenericDocumentListOptions
    ): Promise<ApiResponse<GenericDocument[]>> {
      return withLogging("GenericDocumentService", "getAll", (async () => {
        const ref = collPath(companyId);
        const whereConstraints = [];

        // Add filters based on options
        if (options?.documentType) {
          whereConstraints.push(where("documentType", "==", options.documentType));
        }
        if (options?.entityType && options?.entityId) {
          whereConstraints.push(where("toEntity.type", "==", options.entityType));
          whereConstraints.push(where("toEntity.id", "==", options.entityId));
        }
        if (options?.status) {
          whereConstraints.push(where("status", "==", options.status));
        }

        // Build query with proper constraint ordering
        const allConstraints = [
          ...whereConstraints,
          orderBy(options?.orderByField ?? "createdAt", options?.orderDirection ?? "desc"),
          limit(options?.limitCount ?? 500),
        ];

        const q = query(ref, ...allConstraints);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((docSnap) =>
          mapDocWithTimestamps<GenericDocument>(docSnap.id, docSnap.data() as Record<string, unknown>)
        );
        return { data: items, message: "Success" };
      })());
    },

    async getById(companyId: string, id: string): Promise<ApiResponse<GenericDocument>> {
      return withLogging("GenericDocumentService", "getById", (async () => {
        const docSnap = await getDoc(doc(db, "companies", companyId, "documents", id));
        if (!docSnap.exists()) throw new Error("GenericDocumentService: not found");
        return {
          data: mapDocWithTimestamps<GenericDocument>(docSnap.id, docSnap.data() as Record<string, unknown>),
          message: "Success",
        };
      })());
    },

    async getByDocumentNumber(
      companyId: string,
      documentNumber: string
    ): Promise<ApiResponse<GenericDocument>> {
      return withLogging("GenericDocumentService", "getByDocumentNumber", (async () => {
        const ref = collPath(companyId);
        const q = query(ref, where("documentNumber", "==", documentNumber), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error("GenericDocumentService: not found");
        const docSnap = snapshot.docs[0];
        return {
          data: mapDocWithTimestamps<GenericDocument>(docSnap.id, docSnap.data() as Record<string, unknown>),
          message: "Success",
        };
      })());
    },

    async create(companyId: string, data: CreateGenericDocumentDTO): Promise<ApiResponse<GenericDocument>> {
      return withLogging("GenericDocumentService", "create", (async () => {
        const payload = stripUndefined({
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        const docRef = await addDoc(collPath(companyId), payload);
        const newDoc = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<GenericDocument>(newDoc.id, newDoc.data() as Record<string, unknown>),
          message: "Created successfully",
        };
      })());
    },

    async update(companyId: string, id: string, data: UpdateGenericDocumentDTO): Promise<ApiResponse<GenericDocument>> {
      return withLogging("GenericDocumentService", "update", (async () => {
        const docRef = doc(db, "companies", companyId, "documents", id);
        const clean = stripUndefined({ ...data, updatedAt: serverTimestamp() } as Record<string, unknown>);
        await updateDoc(docRef, clean);
        const updated = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<GenericDocument>(updated.id, updated.data() as Record<string, unknown>),
          message: "Updated successfully",
        };
      })());
    },

    async delete(companyId: string, id: string): Promise<void> {
      return withLogging("GenericDocumentService", "delete", (async () => {
        await deleteDoc(doc(db, "companies", companyId, "documents", id));
      })());
    },

    /**
     * Get documents by entity (e.g., all invoices for a contact)
     */
    async getByEntity(
      companyId: string,
      entityType: EntityType,
      entityId: string,
      documentType?: DocumentType
    ): Promise<ApiResponse<GenericDocument[]>> {
      return withLogging("GenericDocumentService", "getByEntity", (async () => {
        const ref = collPath(companyId);
        const whereConstraints = [
          where("toEntity.type", "==", entityType),
          where("toEntity.id", "==", entityId),
        ];

        if (documentType) {
          whereConstraints.push(where("documentType", "==", documentType));
        }

        const allConstraints = [
          ...whereConstraints,
          orderBy("createdAt", "desc"),
          limit(100),
        ];

        const q = query(ref, ...allConstraints);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((docSnap) =>
          mapDocWithTimestamps<GenericDocument>(docSnap.id, docSnap.data() as Record<string, unknown>)
        );
        return { data: items, message: "Success" };
      })());
    },

    /**
     * Get documents by related entity (e.g., all invoices for a project)
     */
    async getByRelatedEntity(
      companyId: string,
      entityType: EntityType,
      entityId: string,
      documentType?: DocumentType
    ): Promise<ApiResponse<GenericDocument[]>> {
      return withLogging("GenericDocumentService", "getByRelatedEntity", (async () => {
        const ref = collPath(companyId);
        const whereConstraints = [
          where("relatedEntity.type", "==", entityType),
          where("relatedEntity.id", "==", entityId),
        ];

        if (documentType) {
          whereConstraints.push(where("documentType", "==", documentType));
        }

        const allConstraints = [
          ...whereConstraints,
          orderBy("createdAt", "desc"),
          limit(100),
        ];

        const q = query(ref, ...allConstraints);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((docSnap) =>
          mapDocWithTimestamps<GenericDocument>(docSnap.id, docSnap.data() as Record<string, unknown>)
        );
        return { data: items, message: "Success" };
      })());
    },

    /**
     * Reserve a document number based on document type
     * Note: This uses the BillingService.reserveDocumentNumber method
     */
    async reserveDocumentNumber(
      companyId: string,
      documentType: DocumentType
    ): Promise<string> {
      const { BillingService } = await import("./billing.service");
      
      // Only support document types that have sequence settings
      const supportedTypes = ["invoice", "quotation", "estimate", "proposal"];
      if (!supportedTypes.includes(documentType)) {
        throw new Error(`Document type ${documentType} does not have a configured sequence`);
      }
      
      return await BillingService.reserveDocumentNumber(
        companyId,
        documentType as "invoice" | "quotation" | "estimate" | "proposal"
      );
    },
  };
}

export const GenericDocumentService = createGenericDocumentService();
