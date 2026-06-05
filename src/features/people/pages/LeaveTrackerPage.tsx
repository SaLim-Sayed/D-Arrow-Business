import { PageHeader } from "@/components/shared/page-header";
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, useDisclosure } from "@heroui/react";
import { Plus, Calendar, Download } from "lucide-react";
import { LeaveBalanceCards } from "../components/LeaveBalanceCards";
import { useLeaveRequestsQuery } from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";
import { useTranslation } from "react-i18next";

export default function LeaveTrackerPage() {
  const { t } = useTranslation("people");
  const { t: tc } = useTranslation("common");
  
  const { data: requestsResponse, isLoading } = useLeaveRequestsQuery();
  const requests = requestsResponse?.data || [];
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const columns = [
    { name: t("leave_tracker.col_employee") || "EMPLOYEE", uid: "employeeName" },
    { name: t("leave_tracker.col_type") || "TYPE", uid: "type" },
    { name: t("leave_tracker.start_date") || "START DATE", uid: "startDate" },
    { name: t("leave_tracker.end_date") || "END DATE", uid: "endDate" },
    { name: t("leave_tracker.col_status") || "STATUS", uid: "status" },
  ];

  const statusColors: Record<string, string> = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("leave_tracker.title")}
        description={t("leave_tracker.subtitle")}
        eyebrow={tc("portals.people.short")}
        actions={
          <>
            <Button variant="flat" startContent={<Download size={18} />}>
              {tc("actions.export")}
            </Button>
            <Button color="primary" variant="shadow" className="rounded-full font-bold" startContent={<Plus size={18} />} onPress={onOpen}>
              {t("leave_tracker.apply_leave")}
            </Button>
          </>
        }
      />

      <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />

      <LeaveBalanceCards />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            {t("profile.leave_history")}
          </h2>
        </div>

        <Table 
          aria-label="Leave history table"
          className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100"
          removeWrapper
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} className="bg-default-50 text-default-500 font-bold text-xs py-4">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={requests} loadingContent={<div>{tc("actions.loading")}</div>} isLoading={isLoading}>
            {(item) => (
              <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors">
                {(columnKey) => (
                  <TableCell className="py-4">
                    {columnKey === "status" ? (
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={statusColors[item.status] as any}
                        className="capitalize font-semibold"
                      >
                        {item.status}
                      </Chip>
                    ) : columnKey === "startDate" || columnKey === "endDate" ? (
                      new Date(item[columnKey as keyof typeof item] as any).toLocaleDateString()
                    ) : (
                      item[columnKey as keyof typeof item]?.toString()
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
