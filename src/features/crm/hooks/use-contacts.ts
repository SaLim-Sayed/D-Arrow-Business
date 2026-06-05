import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ContactsService } from "../api/contacts.service";
import { ActivitiesService } from "../api/activities.service";
import type { CreateContactDTO, UpdateContactDTO } from "../types/contacts.types";
import { filterCrmRecordsByAccess } from "../utils/crm-access.utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useContactsQuery() {
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: QUERY_KEYS.crm.contacts(companyId!),
    queryFn: async () => {
      const res = await ContactsService.getContacts(companyId!);
      return { ...res, data: filterCrmRecordsByAccess(res.data, user) };
    },
    enabled: !!companyId,
  });
}

export function useContactQuery(contactId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["crm", "contact", contactId],
    queryFn: () => ContactsService.getContactById(companyId!, contactId),
    enabled: !!companyId && !!contactId,
  });
}

export function useCreateContactMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateContactDTO) => {
      const res = await ContactsService.createContact(companyId!, data);
      if (userId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Contact created",
          description: `${data.firstName} ${data.lastName}`.trim(),
          entityType: "contact",
          entityId: res.data.id,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("contacts.toast.created"));
    },
    onError: () => toast.error(t("contacts.toast.createFailed")),
  });
}

export function useUpdateContactMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactDTO }) => {
      const res = await ContactsService.updateContact(companyId!, id, data);
      if (userId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Contact updated",
          entityType: "contact",
          entityId: id,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      return res;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      queryClient.invalidateQueries({ queryKey: ["crm", "contact", id] });
      toast.success(t("contacts.toast.updated"));
    },
    onError: () => toast.error(t("contacts.toast.updateFailed")),
  });
}
