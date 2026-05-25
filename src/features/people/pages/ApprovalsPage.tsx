
import { 
  Button, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip,
  User,
  Tooltip
} from "@heroui/react";
import { Check, X, Bell } from "lucide-react";
import { useLeaveRequestsQuery } from "../hooks/use-people";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useTranslation } from "react-i18next";

export function ApprovalsPage() {
  const { t } = useTranslation("people");
  
  const { companyId } = useCompany();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: requestsResponse } = useLeaveRequestsQuery();
  
  const pendingRequests = requestsResponse?.data?.filter(r => r.status === "pending") || [];
  const isManager = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager';

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!companyId || !user) return;
    try {
      await PeopleService.updateLeaveRequestStatus(companyId, requestId, status, user.id);
      toast.success(t(`approvals.msg_${status}_success`));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.leaveRequests(companyId) });
    } catch (error) {
      toast.error(t("approvals.msg_update_error"));
    }
  };

  const columns = [
    { name: t("approvals.col_employee") || "EMPLOYEE", uid: "employee" },
    { name: t("approvals.col_type") || "LEAVE TYPE", uid: "type" },
    { name: t("approvals.col_duration") || "DURATION", uid: "duration" },
    { name: t("approvals.col_reason") || "REASON", uid: "reason" },
    { name: t("approvals.col_actions") || "ACTIONS", uid: "actions" },
  ];

  if (!isManager) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <X size={48} className="text-danger" />
        <h2 className="text-2xl font-bold">{t("approvals.access_denied")}</h2>
        <p className="text-default-500">{t("approvals.no_permission")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {t("approvals.title")}
          </h1>
          <p className="text-default-500 font-medium">
            {t("approvals.subtitle")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          {t("approvals.pending_requests")}
        </h2>

        <Table 
          aria-label="Pending approvals table"
          className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100"
          removeWrapper
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                className="bg-default-50 text-default-500 font-bold text-xs py-4"
                align={column.uid === "actions" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={pendingRequests} emptyContent={t("approvals.no_pending")}>
            {(item) => (
              <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors">
                {(columnKey) => (
                  <TableCell className="py-4">
                    {columnKey === "employee" ? (
                      <User
                        name={item.employeeName}
                        description="Software Engineer"
                        avatarProps={{ size: "sm" }}
                      />
                    ) : columnKey === "type" ? (
                      <Chip size="sm" variant="flat" color="primary" className="capitalize">
                        {item.type}
                      </Chip>
                    ) : columnKey === "duration" ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-bold">
                          {new Date(item.startDate as any).toLocaleDateString()}
                        </span>
                        <span className="text-default-400">
                          to {new Date(item.endDate as any).toLocaleDateString()}
                        </span>
                      </div>
                    ) : columnKey === "reason" ? (
                      <p className="text-xs text-default-600 max-w-[200px] truncate">
                        {item.reason}
                      </p>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip content={t("approvals.approve")} color="success">
                          <Button 
                            isIconOnly 
                            size="sm" 
                            color="success" 
                            variant="flat"
                            onPress={() => handleAction(item.id, 'approved')}
                          >
                            <Check size={18} />
                          </Button>
                        </Tooltip>
                        <Tooltip content={t("approvals.reject")} color="danger">
                          <Button 
                            isIconOnly 
                            size="sm" 
                            color="danger" 
                            variant="flat"
                            onPress={() => handleAction(item.id, 'rejected')}
                          >
                            <X size={18} />
                          </Button>
                        </Tooltip>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
