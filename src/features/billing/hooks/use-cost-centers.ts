import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCostCenterDTO, UpdateCostCenterDTO } from "../schemas/cost-center";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";

const MOCK_COST_CENTERS: CreateCostCenterDTO[] = [
  { code: "CC-101", name: "فرع الرياض", description: "مركز تكلفة فرع الرياض الرئيسي", isActive: true },
  { code: "CC-102", name: "فرع جدة", description: "مركز تكلفة فرع جدة", isActive: true },
  { code: "CC-201", name: "قسم التسويق", description: "مصاريف الحملات والأنشطة التسويقية", isActive: true },
  { code: "CC-202", name: "قسم تقنية المعلومات", description: "مصاريف البنية التحتية والأنظمة", isActive: true },
];

export function useCostCenters() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "costCenters", companyId],
    queryFn: async () => {
      const res = await BillingService.costCenters.getAll(companyId!);
      if (res.data.length === 0) {
        const seedPromises = MOCK_COST_CENTERS.map((cc) =>
          BillingService.costCenters.create(companyId!, cc)
        );
        const seeded = await Promise.all(seedPromises);
        return seeded.map((s) => s.data);
      }
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateCostCenterMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: CreateCostCenterDTO) => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await BillingService.costCenters.create(companyId, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "costCenters", companyId] });
    },
  });
}

export function useUpdateCostCenterMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCostCenterDTO }) => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await BillingService.costCenters.update(companyId, id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "costCenters", companyId] });
    },
  });
}

export function useDeleteCostCenterMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!companyId) throw new Error("Company ID is required");
      await BillingService.costCenters.delete(companyId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "costCenters", companyId] });
    },
  });
}
