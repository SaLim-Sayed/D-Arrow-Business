import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ClientReportsService } from "../api/client-reports.service";
import type {
  CreateClientReportDTO,
  UpdateClientReportDTO,
} from "../types/client-reports.types";
import { toast } from "sonner";

export function useClientReportsQuery(filters?: {
  contactId?: string;
  dealId?: string;
  authorId?: string;
  reportType?: string;
  clientMood?: string;
}) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["crm", "client-reports", companyId, filters],
    queryFn: async () => {
      const res = await ClientReportsService.getClientReports(companyId!, filters);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useClientReportQuery(reportId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["crm", "client-report", companyId, reportId],
    queryFn: async () => {
      const res = await ClientReportsService.getClientReportById(companyId!, reportId);
      return res.data;
    },
    enabled: !!companyId && !!reportId,
  });
}

export function useCreateClientReportMutation() {
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateClientReportDTO) => {
      if (!companyId) throw new Error("No company selected");
      if (!user) throw new Error("User not authenticated");

      const author = {
        id: user.id || user.uid || "",
        name: user.displayName || user.name || user.email || "الموظف",
        email: user.email,
      };

      return await ClientReportsService.createClientReport(companyId, payload, author);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "client-reports"] });
      toast.success(res.message || "تم إنشاء تقرير العميل بنجاح");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ تقرير العميل");
    },
  });
}

export function useUpdateClientReportMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientReportDTO }) => {
      if (!companyId) throw new Error("No company selected");
      return await ClientReportsService.updateClientReport(companyId, id, data);
    },
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "client-reports"] });
      queryClient.invalidateQueries({ queryKey: ["crm", "client-report", companyId, id] });
      toast.success(res.message || "تم تحديث التقرير بنجاح");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء تحديث التقرير");
    },
  });
}

export function useDeleteClientReportMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!companyId) throw new Error("No company selected");
      return await ClientReportsService.deleteClientReport(companyId, id);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "client-reports"] });
      toast.success(res.message || "تم حذف التقرير بنجاح");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حذف التقرير");
    },
  });
}
