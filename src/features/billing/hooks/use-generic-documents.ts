import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GenericDocument,
  CreateGenericDocumentDTO,
  UpdateGenericDocumentDTO,
  DocumentType,
  EntityType,
} from "../schemas/generic-document";
import { GenericDocumentService } from "../api/generic-document.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Generic hooks for working with all document types
 */

export function useGenericDocuments(options?: {
  documentType?: DocumentType;
  entityType?: EntityType;
  entityId?: string;
  status?: string;
}) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "documents", companyId, options],
    queryFn: async () => {
      const res = await GenericDocumentService.getAll(companyId!, options);
      const data = convertTimestampsToDates(res.data) as GenericDocument[];
      return data.sort(
        (a, b) => b.issueDate.getTime() - a.issueDate.getTime()
      );
    },
    enabled: !!companyId,
  });
}

export function useGenericDocument(id?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "documents", companyId, id],
    queryFn: async () => {
      const res = await GenericDocumentService.getById(companyId!, id!);
      return convertTimestampsToDates(res.data) as GenericDocument;
    },
    enabled: !!id && !!companyId,
  });
}

export function useGenericDocumentsByEntity(
  entityType: EntityType,
  entityId: string,
  documentType?: DocumentType
) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "documents", "byEntity", companyId, entityType, entityId, documentType],
    queryFn: async () => {
      const res = await GenericDocumentService.getByEntity(
        companyId!,
        entityType,
        entityId,
        documentType
      );
      return convertTimestampsToDates(res.data) as GenericDocument[];
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useGenericDocumentsByRelatedEntity(
  entityType: EntityType,
  entityId: string,
  documentType?: DocumentType
) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "documents", "byRelatedEntity", companyId, entityType, entityId, documentType],
    queryFn: async () => {
      const res = await GenericDocumentService.getByRelatedEntity(
        companyId!,
        entityType,
        entityId,
        documentType
      );
      return convertTimestampsToDates(res.data) as GenericDocument[];
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useCreateGenericDocumentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (data: CreateGenericDocumentDTO) => {
      const payload: CreateGenericDocumentDTO = {
        ...data,
        createdBy: userId,
      };
      const res = await GenericDocumentService.create(companyId!, payload);
      return convertTimestampsToDates(res.data) as GenericDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "documents"] });
    },
  });
}

export function useUpdateGenericDocumentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGenericDocumentDTO }) => {
      const payload: UpdateGenericDocumentDTO = {
        ...data,
        updatedBy: userId,
      };
      const res = await GenericDocumentService.update(companyId!, id, payload);
      return convertTimestampsToDates(res.data) as GenericDocument;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "documents"] });
      queryClient.invalidateQueries({
        queryKey: ["billing", "documents", variables.id],
      });
    },
  });
}

export function useDeleteGenericDocumentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      await GenericDocumentService.delete(companyId!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "documents"] });
    },
  });
}

/**
 * Invoice-specific hooks using the generic document system
 * These maintain backward compatibility with existing invoice code
 */

export function useInvoicesFromGeneric() {
  const { data: documents = [], ...rest } = useGenericDocuments({
    documentType: "invoice",
  });
  
  // Filter to only invoice documents
  const invoices = documents.filter(doc => doc.documentType === "invoice");
  
  return { data: invoices, ...rest };
}

export function useInvoiceFromGeneric(id?: string) {
  const { data: document, ...rest } = useGenericDocument(id);
  
  // Convert generic document to invoice format
  const invoice = document && document.documentType === "invoice" 
    ? document 
    : null;
  
  return { data: invoice, ...rest };
}

export function useInvoicesByCustomerFromGeneric(customerId?: string) {
  const { data: documents = [], ...rest } = useGenericDocumentsByEntity(
    "contact",
    customerId || "",
    "invoice"
  );
  
  return { data: documents, ...rest };
}
