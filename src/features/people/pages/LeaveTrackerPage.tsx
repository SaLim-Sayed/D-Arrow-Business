import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useDisclosure,
  Card,
  CardBody,
} from "@heroui/react";
import { Plus, Calendar, Umbrella, Thermometer, UserMinus, Clock } from "lucide-react";
import { useLeaveRequestsQuery } from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";

export default function LeaveTrackerPage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { t: tc } = useTranslation("common");

  const { data: requestsResponse, isLoading } = useLeaveRequestsQuery();
  const requests = requestsResponse?.data || [];
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const columns = [
    { name: isAr ? "اسم الموظف" : "EMPLOYEE", uid: "employeeName" },
    { name: isAr ? "نوع الإجازة" : "TYPE", uid: "type" },
    { name: isAr ? "تاريخ البداية" : "START DATE", uid: "startDate" },
    { name: isAr ? "تاريخ النهاية" : "END DATE", uid: "endDate" },
    { name: isAr ? "الحالة والاعتماد" : "STATUS", uid: "status" },
  ];

  const statusColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
  };

  const balances = [
    { label: isAr ? "الإجازة السنوية (المستحقة)" : "Annual Leave", value: "21", total: "30", icon: <Umbrella size={24} />, color: "text-primary", bg: "bg-primary/10" },
    { label: isAr ? "الإجازات المرضية" : "Sick Leave", value: "15", total: "15", icon: <Thermometer size={24} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: isAr ? "إجازات بدون راتب" : "Unpaid Leave", value: "5", total: "10", icon: <UserMinus size={24} />, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: isAr ? "طلبات قيد المراجعة" : "Pending Requests", value: requests.filter((r) => r.status === "pending").length.toString(), total: null, icon: <Clock size={24} />, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Umbrella size={28} />
            </div>
            {isAr ? "إدارة وأرصدة الإجازات (جسـر)" : "Jisr Leave Management & Balances"}
          </h1>
          <p className="text-default-400 font-medium text-xs md:text-sm mt-1">
            {isAr ? "تقديم ومتابعة طلبات الإجازات وحساب الأرصدة المستحقة والموافقات" : "Manage leave requests, annual balances, and supervisor approvals"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button color="primary" variant="shadow" className="rounded-2xl font-bold h-11 px-6 shadow-lg shadow-primary/25" startContent={<Plus size={18} />} onPress={onOpen}>
            {isAr ? "تقديم طلب إجازة جديدة" : "Apply New Leave"}
          </Button>
        </div>
      </div>

      <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />

      {/* Jisr Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((item) => (
          <Card key={item.label} className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className={`p-3.5 rounded-2xl ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-default-400">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-foreground">{item.value}</span>
                  {item.total && (
                    <span className="text-xs font-bold text-default-400">{isAr ? `من ${item.total} يوم` : `/ ${item.total} days`}</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Leave Requests Table */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl overflow-hidden bg-background/80 backdrop-blur-xl">
        <CardBody className="p-0">
          <div className="p-5 border-b border-default-200/60 flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2 text-foreground">
              <Calendar size={18} className="text-primary" />
              {isAr ? "جدول كافة طلبات الإجازات المقدمة" : "All Submitted Leave Requests"}
            </h2>
          </div>

          <Table aria-label="جدول طلبات الإجازات" className="w-full">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} className="bg-default-50 text-default-500 font-bold text-xs py-4">
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={requests} loadingContent={<div className="p-6 text-center text-default-400">{tc("actions.loading")}</div>} isLoading={isLoading}>
              {(item) => (
                <TableRow key={item.id} className="hover:bg-default-50/50 transition-colors">
                  {(columnKey) => (
                    <TableCell className="py-4">
                      {columnKey === "status" ? (
                        <Chip size="sm" variant="flat" color={statusColors[item.status] || "default"} className="font-bold text-[10px]">
                          {item.status === "approved" ? (isAr ? "مقبولة ومعتمدة" : "Approved") : item.status === "pending" ? (isAr ? "قيد الدراسة" : "Pending") : (isAr ? "مرفوضة" : "Rejected")}
                        </Chip>
                      ) : columnKey === "type" ? (
                        <span className="font-bold text-xs text-foreground">{t(`leave_modal.type_${item.type}`, item.type)}</span>
                      ) : columnKey === "startDate" || columnKey === "endDate" ? (
                        <span className="text-xs font-semibold">{formatDate(item[columnKey as keyof typeof item] as any)}</span>
                      ) : (
                        <span className="font-bold text-xs text-foreground">{item[columnKey as keyof typeof item]?.toString()}</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
