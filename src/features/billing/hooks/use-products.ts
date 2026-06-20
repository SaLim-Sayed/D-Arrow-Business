import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProductDTO,
  UpdateProductDTO,
} from "../schemas/product";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";

// --- Hooks ---
export function useProducts() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["billing", "products", companyId],
    queryFn: async () => {
      const res = await BillingService.products.getAll(companyId!);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useProductCategories() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["billing", "product-categories", companyId],
    queryFn: async () => {
      const res = await BillingService.productCategories.getAll(companyId!);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useProductUnits() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["billing", "product-units", companyId],
    queryFn: async () => {
      const res = await BillingService.productUnits.getAll(companyId!);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {
      const res = await BillingService.products.create(companyId!, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDTO }) => {
      const res = await BillingService.products.update(companyId!, id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      await BillingService.products.delete(companyId!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}
