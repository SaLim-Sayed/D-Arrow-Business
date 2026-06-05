import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { LeadConversionService } from "../api/lead-conversion.service";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { QUERY_KEYS } from "@/lib/constants";

export function useConvertLeadMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => {
      if (!userId) throw new Error("Not authenticated");
      return LeadConversionService.convertToContact(companyId!, leadId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("leads.convert.success"));
    },
    onError: () => toast.error(t("leads.convert.failed")),
  });
}
