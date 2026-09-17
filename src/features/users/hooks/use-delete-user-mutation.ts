import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersService } from "../api/users.service";
import { useCompany } from "@/features/companies/context/company-context";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/constants";

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email?: string }) => {
      await UsersService.deleteUser(companyId!, userId, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId) });
        queryClient.invalidateQueries({ queryKey: ["invites"] });
      }
      toast.success("تم حذف المستخدم وكافة بياناته من فيربيس بنجاح 🗑️");
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل حذف المستخدم من فيربيس");
    },
  });
}

export function useDeleteUserByEmailMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (email: string) => {
      return await UsersService.deleteUserByEmail(companyId!, email);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId) });
        queryClient.invalidateQueries({ queryKey: ["invites"] });
      }
      toast.success(`تم حذف المستخدم صاحب البريد وحذف (${count}) سجلات مرتبطة من فيربيس بنجاح 🗑️`);
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل حذف المستخدم بالبريد الإلكتروني");
    },
  });
}
