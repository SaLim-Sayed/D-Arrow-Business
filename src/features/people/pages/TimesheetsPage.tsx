import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Input,
} from "@heroui/react";
import {
  Download,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useEmployeesQuery, useAllAttendanceQuery } from "../hooks/use-people";
import { useTranslation } from "react-i18next";
import { TimeTrackerWidget } from "../components/TimeTrackerWidget";
import { employeeDisplayName } from "../utils/geo";

export default function TimesheetsPage() {
  const { i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery();
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useAllAttendanceQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthOffset, setMonthOffset] = useState(0);

  const employees = employeesResponse?.data || [];
  const allLogs = attendanceResponse?.data || [];

  // Calculate target month boundaries
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthOffset);
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
  const today = new Date();
  const actualEnd = endOfMonth > today ? today : endOfMonth;

  // Create a map of employee -> date -> log for quick lookup
  const logMap = new Map<string, any>();
  allLogs.forEach((log) => {
    const logDate = new Date(log.date);
    if (logDate >= startOfMonth && logDate <= endOfMonth) {
      logMap.set(`${log.employeeId}_${log.date}`, log);
      logMap.set(`${employees.find((e) => e.id === log.employeeId)?.userId}_${log.date}`, log);
    }
  });

  // Generate enriched logs with absent days filled in
  const enrichedLogs: any[] = [];

  employees.forEach((employee) => {
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate as Date | string) : new Date();
    const empStartDate = startOfMonth > joiningDate ? startOfMonth : joiningDate;

    if (empStartDate > actualEnd) return;

    let employeeName = employeeDisplayName(employee, i18n.language);
    if (!employeeName || employeeName === "—") {
      employeeName = isAr ? "موظف" : "Employee";
    }

    for (let d = new Date(empStartDate); d <= actualEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const key1 = `${employee.id}_${dateStr}`;
      const key2 = `${employee.userId}_${dateStr}`;

      const existingLog = logMap.get(key1) || logMap.get(key2);

      if (existingLog) {
        enrichedLogs.push({
          ...existingLog,
          employeeName,
          employeeDept: employee.department || "-",
        });
      } else {
        enrichedLogs.push({
          id: `absent-${employee.id}-${dateStr}`,
          employeeId: employee.id,
          date: dateStr,
          status: "absent",
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          employeeName,
          employeeDept: employee.department || "-",
        });
      }
    }
  });

  enrichedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter logs
  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      const matchesSearch = log.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedLogs, searchQuery, statusFilter]);

  // Attendance Metrics
  const metrics = useMemo(() => {
    const total = enrichedLogs.length;
    const presentCount = enrichedLogs.filter((l) => l.status === "present").length;
    const lateCount = enrichedLogs.filter((l) => l.status === "late").length;
    const absentCount = enrichedLogs.filter((l) => l.status === "absent").length;
    const attendanceRate = total > 0 ? (((presentCount + lateCount) / total) * 100).toFixed(0) : "100";

    return { total, presentCount, lateCount, absentCount, attendanceRate };
  }, [enrichedLogs]);

  const formatHours = (decimalHours?: number) => {
    if (!decimalHours) return "-";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const downloadCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Date", "Employee Name", "Department", "Check In", "Check Out", "Total Hours", "Status"];
    const csvRows = filteredLogs.map((log) => {
      const date = new Date(log.date).toLocaleDateString();
      const checkIn = log.checkIn ? new Date(log.checkIn as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
      const checkOut = log.checkOut ? new Date(log.checkOut as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
      const hours = log.totalHours ? log.totalHours.toFixed(2) : "0";

      return `"${date}","${log.employeeName}","${log.employeeDept}","${checkIn}","${checkOut}","${hours}","${log.status}"`;
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Clock size={28} />
            </div>
            {isAr ? "نظام الحضور والإنصراف البصمي (جسـر)" : "Jisr Attendance & Timesheets"}
          </h1>
          <p className="text-default-400 font-medium text-xs md:text-sm mt-1">
            {isAr ? "متابعة سجلات الحضور اليومية والبصمة الجغرافية وساعات العمل وسجل التأخير" : "Monitor employee punches, check-ins, check-outs, and overtime"}
          </p>
        </div>

        <Button
          color="primary"
          variant="shadow"
          onPress={downloadCSV}
          startContent={<Download size={18} />}
          isDisabled={filteredLogs.length === 0}
          className="font-bold rounded-2xl h-11 px-6 shadow-lg shadow-primary/25"
        >
          {isAr ? "تصدير السجل كملف Excel / CSV" : "Export Timesheets"}
        </Button>
      </div>

      {/* Live Punch TimeTracker Widget Integration */}
      <div className="w-full">
        <TimeTrackerWidget />
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase">{isAr ? "أيام الحضور" : "Present Days"}</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics.presentCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase">{isAr ? "حالات التأخير" : "Late Punches"}</p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">{metrics.lateCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-danger-500/10 text-danger">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase">{isAr ? "أيام الغياب" : "Absent Days"}</p>
              <h3 className="text-xl font-black text-danger">{metrics.absentCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase">{isAr ? "نسبة التزام الحضور" : "Attendance Rate"}</p>
              <h3 className="text-xl font-black text-primary">{metrics.attendanceRate}%</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter Bar & Timesheet Table */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl overflow-hidden bg-background/80 backdrop-blur-xl">
        <CardBody className="p-0">
          <div className="flex flex-col sm:flex-row p-4 border-b border-default-200/60 bg-default-50/50 gap-4 justify-between items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <Input
                placeholder={isAr ? "ابحث باسم الموظف..." : "Search employee..."}
                startContent={<Search size={16} className="text-default-400" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="w-full sm:w-72"
                variant="bordered"
                size="sm"
                classNames={{ inputWrapper: "rounded-2xl bg-background" }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background text-foreground border border-default-200/60 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-none focus:border-primary shadow-xs"
              >
                <option value="all">{isAr ? "جميع الحالات" : "All Statuses"}</option>
                <option value="present">{isAr ? "حاضر" : "Present"}</option>
                <option value="late">{isAr ? "تأخير" : "Late"}</option>
                <option value="absent">{isAr ? "غياب" : "Absent"}</option>
              </select>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-3 bg-background rounded-2xl p-1.5 shadow-xs border border-default-200/60">
              <Button isIconOnly size="sm" variant="light" onPress={() => setMonthOffset((prev) => prev - 1)}>
                <ChevronRight size={16} />
              </Button>
              <span className="text-xs font-bold w-36 text-center text-foreground">
                {targetDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "long", year: "numeric" })}
              </span>
              <Button isIconOnly size="sm" variant="light" onPress={() => setMonthOffset((prev) => prev + 1)} isDisabled={monthOffset >= 0}>
                <ChevronLeft size={16} />
              </Button>
            </div>
          </div>

          {isEmployeesLoading || isAttendanceLoading ? (
            <div className="p-12 text-center text-default-400 font-medium">{isAr ? "جاري تحميل سجلات البصمة والحضور..." : "Loading attendance records..."}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-default-400 flex flex-col items-center gap-2">
              <Clock size={36} className="text-default-300" />
              <p className="text-sm font-semibold">{isAr ? "لا توجد سجلات حضور مدونة لهذا الشهر" : "No attendance logs for this period"}</p>
            </div>
          ) : (
            <Table aria-label="Company timesheets" className="w-full">
              <TableHeader>
                <TableColumn>{isAr ? "التاريخ" : "Date"}</TableColumn>
                <TableColumn>{isAr ? "اسم الموظف" : "Employee"}</TableColumn>
                <TableColumn>{isAr ? "القسم" : "Department"}</TableColumn>
                <TableColumn>{isAr ? "تسجيل الدخول" : "Check In"}</TableColumn>
                <TableColumn>{isAr ? "تسجيل الخروج" : "Check Out"}</TableColumn>
                <TableColumn>{isAr ? "موقع البصمة" : "Location"}</TableColumn>
                <TableColumn>{isAr ? "ساعات العمل" : "Hours"}</TableColumn>
                <TableColumn>{isAr ? "الحالة" : "Status"}</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, idx) => (
                  <TableRow key={`${log.id}-${idx}`} className="hover:bg-default-50/50 transition-colors">
                    <TableCell className="font-bold text-xs text-foreground">
                      {new Date(log.date).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-xs text-foreground">{log.employeeName}</p>
                    </TableCell>
                    <TableCell className="text-xs text-default-500">{log.employeeDept}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      {log.checkIn ? new Date(log.checkIn as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {log.checkOut ? new Date(log.checkOut as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-default-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary" />
                        {log.checkInLocationName || log.location || (isAr ? "المقر الرئيسي" : "Main Office")}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-xs text-primary">{formatHours(log.totalHours)}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={log.status === "present" ? "success" : log.status === "late" ? "warning" : "danger"}
                        className="capitalize font-bold text-[10px]"
                      >
                        {log.status === "present" ? (isAr ? "حاضر" : "Present") : log.status === "late" ? (isAr ? "تأخير" : "Late") : (isAr ? "غياب" : "Absent")}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
