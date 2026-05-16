
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import { Plus, Calendar, Download } from "lucide-react";
import { LeaveBalanceCards } from "../components/LeaveBalanceCards";
import { useLeaveRequestsQuery } from "../hooks/use-people";

export default function LeaveTrackerPage() {
  
  const { data: requestsResponse, isLoading } = useLeaveRequestsQuery();
  const requests = requestsResponse?.data || [];

  const columns = [
    { name: "EMPLOYEE", uid: "employeeName" },
    { name: "TYPE", uid: "type" },
    { name: "START DATE", uid: "startDate" },
    { name: "END DATE", uid: "endDate" },
    { name: "STATUS", uid: "status" },
  ];

  const statusColors: Record<string, string> = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Leave Tracker
          </h1>
          <p className="text-default-500 font-medium">
            Manage time off, vacations, and attendance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="flat" startContent={<Download size={18} />}>
            Export
          </Button>
          <Button color="primary" variant="shadow" startContent={<Plus size={18} />}>
            Apply Leave
          </Button>
        </div>
      </div>

      <LeaveBalanceCards />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Leave History
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
          <TableBody items={requests} loadingContent={<div>Loading...</div>} isLoading={isLoading}>
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
