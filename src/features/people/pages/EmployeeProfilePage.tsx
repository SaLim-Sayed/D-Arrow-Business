import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  useDisclosure,
} from "@heroui/react";
import {
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  User as UserIcon,
  ShieldCheck,
  FileText,
  Clock,
  CalendarDays,
  Star,
  Package,
  GraduationCap,
  Laptop,
  Smartphone,
  CreditCard,
  Building,
  ArrowRight,
  Phone,
  ClipboardCheck,
  ImageIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import {
  useEmployeesQuery,
  useLeaveRequestsQuery,
  useAssetsQuery,
  useUpdateEmployeeMutation,
  useAttendanceQuery,
  useWorkLocationsQuery,
  useAssignAttendanceLocationMutation,
} from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";
import { ManageSkillsModal } from "../components/ManageSkillsModal";
import { AssignAttendanceLocationModal } from "../components/AssignAttendanceLocationModal";
import { DailyReportsService } from "../api/daily-reports.service";
import type { DailyReport } from "../types/daily-report.types";
import type { Attendance } from "../types/people.types";
import { useTranslation } from "react-i18next";
import { useCompany } from "@/features/companies/context/company-context";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";
import { formatDate } from "@/lib/utils";
import { dayToneByKey } from "@/lib/day-tone-by-key";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { avatarSrc } from "@/lib/image-utils";
import { employeeDisplayName, employeeInitials } from "../utils/geo";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "object" && value && "toDate" in value) {
    const converted = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatHours(hours: number | undefined, locale: string) {
  if (!hours) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const nf = new Intl.NumberFormat(locale);
  const isAr = locale.startsWith("ar");
  if (h === 0) return isAr ? `${nf.format(m)}د` : `${m}m`;
  if (m === 0) return isAr ? `${nf.format(h)}س` : `${h}h`;
  return isAr ? `${nf.format(h)}س ${nf.format(m)}د` : `${h}h ${m}m`;
}

const statusColorMap: Record<string, "success" | "primary" | "warning" | "danger" | "default"> = {
  active: "success",
  onboarding: "primary",
  suspended: "warning",
  terminated: "danger",
};

export default function EmployeeProfilePage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language.startsWith("ar");
  const locale = isAr ? "ar-EG" : "en-US";
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { companyId } = useCompany();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isSkillsOpen, onOpen: onSkillsOpen, onOpenChange: onSkillsOpenChange } = useDisclosure();
  const [photoOpen, setPhotoOpen] = useState(false);

  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery();
  const { data: leaveRequestsResponse } = useLeaveRequestsQuery();
  const [activeTab, setActiveTab] = useState("overview");
  const updateMutation = useUpdateEmployeeMutation();

  const [editData, setEditData] = useState({
    department: "",
    role: "",
    jobTitle: "",
    salary: "",
    housingAllowance: "",
    transportAllowance: "",
    officeLocation: "",
    phoneNumber: "",
    nationalId: "",
    iban: "",
    bankName: "",
  });

  const employee = employeesResponse?.data?.find((e) => e.id === id || e.userId === id);
  const employeeRequests =
    leaveRequestsResponse?.data?.filter(
      (r) => r.employeeId === employee?.userId || r.employeeId === employee?.id
    ) || [];
  const isOwnProfile = user?.id === employee?.userId;
  const { canManageEmployees } = useAppPermissions();

  const { data: assetsResponse } = useAssetsQuery();
  const employeeAssets = assetsResponse?.data?.filter((a) => a.assignedTo === employee?.id) || [];

  const { data: attendanceResponse } = useAttendanceQuery(employee?.id || "");
  const attendanceLogs = useMemo(() => {
    const logs = [...(attendanceResponse?.data || [])];
    logs.sort((a, b) => {
      const aMs = toDate(a.checkIn)?.getTime() ?? toDate(a.date)?.getTime() ?? 0;
      const bMs = toDate(b.checkIn)?.getTime() ?? toDate(b.date)?.getTime() ?? 0;
      return bMs - aMs;
    });
    return logs;
  }, [attendanceResponse?.data]);
  const attendanceDayTones = dayToneByKey(attendanceLogs, (log) => formatDate(log.date));
  const { data: locationsRes } = useWorkLocationsQuery();
  const workLocations = locationsRes?.data ?? [];
  const assignLocation = useAssignAttendanceLocationMutation();
  const [assignOpen, setAssignOpen] = useState(false);

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !employee) return;
    const reportOwnerId = employee.userId || employee.id;
    let cancelled = false;
    setReportsLoading(true);
    DailyReportsService.getDailyReports(companyId, { employeeId: reportOwnerId })
      .then((res) => {
        if (!cancelled && res.data) setReports(res.data);
      })
      .catch(() => {
        if (!cancelled) setReports([]);
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, employee?.id, employee?.userId]);

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale]
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthLogs = attendanceLogs.filter((log) => {
      const date = toDate(log.date) || toDate(log.checkIn);
      return date?.getMonth() === now.getMonth() && date?.getFullYear() === now.getFullYear();
    });
    const days = new Set(monthLogs.map((log) => log.date)).size;
    const hours = monthLogs.reduce((sum, log) => sum + (typeof log.totalHours === "number" ? log.totalHours : 0), 0);
    return { days, hours };
  }, [attendanceLogs]);

  const extra = employee as (typeof employee & {
    avatar?: string;
    housingAllowance?: number;
    transportAllowance?: number;
    otherAllowances?: number;
    nationalId?: string;
    iban?: string;
    bankName?: string;
  }) | undefined;

  const photo = avatarSrc(extra?.avatar || employee?.avatarUrl);
  const basicSalary = Number(employee?.salary || 0);
  const housingAllowance = Number(extra?.housingAllowance || 0);
  const transportAllowance = Number(extra?.transportAllowance || 0);
  const otherAllowances = Number(extra?.otherAllowances || 0);
  const hasPay = basicSalary > 0 || housingAllowance > 0 || transportAllowance > 0;
  const grossSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances;
  const gosiDeduction = Number((grossSalary * 0.0975).toFixed(2));
  const netSalary = Math.max(0, grossSalary - gosiDeduction);
  const hasDocuments = Boolean(extra?.nationalId || extra?.iban || extra?.bankName);

  const departmentLabel = employee?.department
    ? t(`departments.${employee.department}`, {
        defaultValue: t(`departments.${employee.department.toUpperCase()}`, {
          defaultValue: employee.department,
        }),
      })
    : "";

  if (isEmployeesLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
        <Card className="rounded-3xl border border-default-200/70 shadow-sm">
          <CardBody className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-56 rounded-xl" />
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-primary/10 p-6">
          <UserIcon size={48} className="text-primary/50" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-black text-foreground">{t("profile.not_found")}</h2>
          <p className="max-w-xs text-sm font-medium text-default-400">{t("profile.not_found_desc")}</p>
        </div>
        <Button color="primary" variant="shadow" onPress={() => navigate("/people")} className="rounded-xl font-bold">
          {t("profile.back_to_directory")}
        </Button>
      </div>
    );
  }

  const displayName = employeeDisplayName(employee, i18n.language);
  const initials = employeeInitials(employee, i18n.language);

  const handleOpenEdit = () => {
    setEditData({
      department: employee.department || "",
      role: employee.role || "employee",
      jobTitle: employee.jobTitle || "",
      salary: employee.salary ? employee.salary.toString() : "",
      housingAllowance: extra?.housingAllowance ? String(extra.housingAllowance) : "",
      transportAllowance: extra?.transportAllowance ? String(extra.transportAllowance) : "",
      officeLocation: employee.officeLocation || "",
      phoneNumber: employee.phoneNumber || "",
      nationalId: extra?.nationalId || "",
      iban: extra?.iban || "",
      bankName: extra?.bankName || "",
    });
    onEditOpen();
  };

  const handleSaveEdit = (onClose: () => void) => {
    updateMutation.mutate({
      employeeId: employee.id,
      data: {
        department: editData.department,
        role: editData.role,
        jobTitle: editData.jobTitle,
        salary: editData.salary ? Number(editData.salary) : undefined,
        housingAllowance: editData.housingAllowance ? Number(editData.housingAllowance) : undefined,
        transportAllowance: editData.transportAllowance ? Number(editData.transportAllowance) : undefined,
        officeLocation: editData.officeLocation,
        phoneNumber: editData.phoneNumber,
        nationalId: editData.nationalId,
        iban: editData.iban,
        bankName: editData.bankName,
      } as never,
    });
    onClose();
  };

  const attendanceStatus = (log: Attendance) => {
    if (!log.checkOut && toDate(log.checkIn)) return { key: "working", color: "success" as const };
    if (log.status === "late") return { key: "late", color: "warning" as const };
    if (log.status === "absent") return { key: "absent", color: "danger" as const };
    return { key: "present", color: "success" as const };
  };

  const metrics = [
    { label: t("profile.metric_present_days"), value: numberFormatter.format(monthStats.days), hint: t("profile.this_month"), icon: Clock },
    { label: t("profile.metric_hours"), value: formatHours(monthStats.hours, locale), hint: t("profile.this_month"), icon: CalendarDays },
    { label: t("profile.metric_reports"), value: numberFormatter.format(reports.length), hint: t("profile.tab_reports"), icon: ClipboardCheck },
    { label: t("profile.metric_leaves"), value: numberFormatter.format(employeeRequests.length), hint: t("profile.total_requests"), icon: Briefcase },
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12 sm:space-y-8">
      <Button
        variant="light"
        size="sm"
        startContent={<ArrowRight className={`h-4 w-4 ${isAr ? "" : "rotate-180"}`} />}
        onPress={() => navigate("/people")}
        className="font-bold text-default-500"
      >
        {t("profile.back_to_directory")}
      </Button>

      <Card className="overflow-hidden rounded-3xl border border-default-200/70 bg-content1 shadow-sm">
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-start">
              <div
                role={photo ? "button" : undefined}
                tabIndex={photo ? 0 : undefined}
                onClick={() => photo && setPhotoOpen(true)}
                onKeyDown={(event) => {
                  if (!photo) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPhotoOpen(true);
                  }
                }}
                className={photo ? "shrink-0 cursor-pointer rounded-full" : "shrink-0"}
                aria-label={photo ? t("profile.view_photo") : undefined}
              >
                <Avatar
                  src={photo}
                  name={initials}
                  fallback={initials}
                  showFallback
                  className="h-24 w-24 text-2xl font-black ring-4 ring-background shadow-lg sm:h-28 sm:w-28"
                  classNames={{ base: "bg-primary/10 text-primary" }}
                />
              </div>

              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{displayName}</h1>
                  <Chip size="sm" color={statusColorMap[employee.status] ?? "default"} variant="flat" className="font-bold">
                    {t(`statuses.${employee.status}`, employee.status)}
                  </Chip>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-default-500 sm:justify-start">
                  {employee.jobTitle && <span className="text-primary">{employee.jobTitle}</span>}
                  {departmentLabel && (
                    <>
                      {employee.jobTitle && <span className="text-default-300">•</span>}
                      <span>{departmentLabel}</span>
                    </>
                  )}
                  {employee.role && (
                    <Chip size="sm" variant="flat" className="h-6 text-[10px] font-black uppercase">
                      {t(`roles.${employee.role}`, employee.role.replace("_", " "))}
                    </Chip>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-default-400 sm:justify-start">
                  {employee.email && (
                    <a href={`mailto:${employee.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                      <Mail size={13} />
                      <span dir="ltr">{employee.email}</span>
                    </a>
                  )}
                  {employee.phoneNumber && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} />
                      <span dir="ltr">{employee.phoneNumber}</span>
                    </span>
                  )}
                  {employee.officeLocation && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {employee.officeLocation}
                    </span>
                  )}
                  {employee.joiningDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      {t("profile.joined")} {formatDate(employee.joiningDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              <Button
                color="primary"
                variant="shadow"
                size="sm"
                startContent={<CalendarDays size={16} />}
                onPress={onOpen}
                className="h-10 rounded-2xl px-4 font-bold"
              >
                {t("profile.apply_leave")}
              </Button>
              {canManageEmployees && (
                <Button
                  variant="bordered"
                  size="sm"
                  startContent={<ShieldCheck size={16} />}
                  onPress={handleOpenEdit}
                  className="h-10 rounded-2xl font-bold"
                >
                  {t("profile.edit_profile")}
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-3xl border border-default-200/60 bg-content1 shadow-sm">
            <CardBody className="flex flex-row items-center gap-3 p-4">
              <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                <metric.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-default-400">{metric.label}</p>
                <p className="text-xl font-black text-foreground">{metric.value}</p>
                <p className="text-[10px] font-medium text-default-400">{metric.hint}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-3xl border border-default-200/70 bg-content1 shadow-sm">
        <CardBody className="p-0">
          <Tabs
            aria-label={t("profile.tab_overview")}
            variant="underlined"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            classNames={{
              tabList: "w-full gap-1 overflow-x-auto rounded-none border-b border-default-100 bg-default-50/60 px-3 sm:px-5",
              cursor: "h-1 w-full rounded-full bg-primary",
              tab: "h-12 max-w-fit rounded-xl px-3 font-bold",
              tabContent: "text-sm font-bold group-data-[selected=true]:text-primary",
              panel: "p-5 sm:p-7",
            }}
          >
            <Tab
              key="overview"
              title={
                <span className="flex items-center gap-2">
                  <UserIcon size={16} />
                  {t("profile.tab_overview")}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-foreground">{t("profile.recent_attendance")}</h3>
                    <Button size="sm" variant="light" color="primary" onPress={() => navigate("/people/timesheets")}>
                      {t("profile.view_all_attendance")}
                    </Button>
                  </div>
                  {attendanceLogs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-default-200 p-6 text-sm text-default-400">
                      {t("profile.no_logs")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {attendanceLogs.slice(0, 4).map((log) => {
                        const status = attendanceStatus(log);
                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-default-100 bg-default-50/70 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-bold text-foreground">{formatDate(log.date)}</p>
                              <p className="text-xs text-default-400">
                                {toDate(log.checkIn) ? timeFormatter.format(toDate(log.checkIn)!) : "—"}
                                {" → "}
                                {toDate(log.checkOut) ? timeFormatter.format(toDate(log.checkOut)!) : "—"}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="text-sm font-black text-primary">{formatHours(log.totalHours, locale)}</p>
                              <Chip size="sm" variant="flat" color={status.color} className="h-5 text-[10px] font-bold">
                                {t(`profile.status_${status.key}`)}
                              </Chip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-foreground">{t("profile.tab_reports")}</h3>
                    <Button size="sm" variant="light" color="primary" onPress={() => navigate("/people/daily-reports")}>
                      {t("profile.view_all_reports")}
                    </Button>
                  </div>
                  {reportsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 rounded-2xl" />
                      <Skeleton className="h-20 rounded-2xl" />
                    </div>
                  ) : reports.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-default-200 p-6 text-sm text-default-400">
                      {t("profile.no_reports")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reports.slice(0, 4).map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => navigate("/people/daily-reports")}
                          className="w-full rounded-2xl border border-default-100 bg-default-50/70 px-4 py-3 text-start hover:border-primary/30"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-foreground">{report.date}</p>
                            <div className="flex gap-1">
                              <Chip size="sm" variant="dot" color="success" className="h-5 border-none text-[10px] font-bold">
                                {t("profile.tasks_done", { count: report.tasksCompleted.length })}
                              </Chip>
                              {report.tasksInProgress.length > 0 && (
                                <Chip size="sm" variant="dot" color="warning" className="h-5 border-none text-[10px] font-bold">
                                  {t("profile.tasks_wip", { count: report.tasksInProgress.length })}
                                </Chip>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-default-500">{report.summary}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </Tab>

            <Tab
              key="attendance"
              title={
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {t("profile.tab_attendance")}
                </span>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-foreground">{t("profile.daily_time_logs")}</h3>
                    <p className="text-xs text-default-400">{t("profile.recent_attendance")}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => setAssignOpen(true)}
                    startContent={<MapPin size={15} />}
                    className="rounded-2xl font-bold"
                  >
                    {t("profile.assign_location")}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-default-100">
                  <Table aria-label={t("profile.daily_time_logs")} className="min-w-[640px]">
                    <TableHeader>
                      <TableColumn>{t("profile.col_date")}</TableColumn>
                      <TableColumn>{t("profile.col_checkin")}</TableColumn>
                      <TableColumn>{t("profile.col_checkout")}</TableColumn>
                      <TableColumn>{t("profile.col_hours")}</TableColumn>
                      <TableColumn>{t("profile.col_status")}</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={t("profile.no_logs")}>
                      {attendanceLogs.map((log, index) => {
                        const status = attendanceStatus(log);
                        return (
                          <TableRow
                            key={log.id}
                            className={[
                              index > 0 &&
                                formatDate(log.date) !== formatDate(attendanceLogs[index - 1].date) &&
                                "attendance-day-divider",
                              `day-group-tone-${attendanceDayTones.get(formatDate(log.date)) ?? 0}`,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <TableCell className="text-xs font-bold">{formatDate(log.date)}</TableCell>
                            <TableCell className="text-xs">
                              {toDate(log.checkIn) ? timeFormatter.format(toDate(log.checkIn)!) : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {toDate(log.checkOut) ? timeFormatter.format(toDate(log.checkOut)!) : "—"}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {formatHours(log.totalHours, locale)}
                            </TableCell>
                            <TableCell>
                              <Chip size="sm" variant="flat" color={status.color} className="text-[10px] font-bold">
                                {t(`profile.status_${status.key}`)}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab
              key="reports"
              title={
                <span className="flex items-center gap-2">
                  <ClipboardCheck size={16} />
                  {t("profile.tab_reports")}
                </span>
              }
            >
              {reportsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 rounded-3xl" />
                  <Skeleton className="h-28 rounded-3xl" />
                </div>
              ) : reports.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-default-200 p-8 text-center text-sm text-default-400">
                  {t("profile.no_reports")}
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-3xl border border-default-100 bg-default-50/60 p-5">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-foreground">{report.date}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip size="sm" variant="flat" color="success" className="text-[10px] font-bold">
                            {t("profile.tasks_done", { count: report.tasksCompleted.length })}
                          </Chip>
                          {report.tasksInProgress.length > 0 && (
                            <Chip size="sm" variant="flat" color="warning" className="text-[10px] font-bold">
                              {t("profile.tasks_wip", { count: report.tasksInProgress.length })}
                            </Chip>
                          )}
                          {report.checkInTime && (
                            <Chip size="sm" variant="flat" className="text-[10px] font-bold">
                              {report.checkInTime} – {report.checkOutTime || "—"}
                            </Chip>
                          )}
                        </div>
                      </div>
                      {report.tasksCompleted.length > 0 && (
                        <ul className="mb-2 space-y-1 text-xs text-default-600">
                          {report.tasksCompleted.map((task) => (
                            <li key={task.id}>✓ {task.title}</li>
                          ))}
                        </ul>
                      )}
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{report.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </Tab>

            <Tab
              key="leaves"
              title={
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {t("profile.tab_leaves")}
                </span>
              }
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: t("profile.total_requests"), value: employeeRequests.length, color: "primary" },
                    {
                      label: t("profile.approved"),
                      value: employeeRequests.filter((r) => r.status === "approved").length,
                      color: "success",
                    },
                    {
                      label: t("profile.pending"),
                      value: employeeRequests.filter((r) => r.status === "pending").length,
                      color: "warning",
                    },
                  ].map((card) => (
                    <div key={card.label} className="rounded-3xl border border-default-100 bg-default-50/70 p-5">
                      <p className="text-xs font-bold text-default-400">{card.label}</p>
                      <p className="mt-1 text-3xl font-black text-foreground">{numberFormatter.format(card.value)}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-default-100">
                  <Table aria-label={t("profile.leave_history")} className="min-w-[560px]">
                    <TableHeader>
                      <TableColumn>{t("leave_modal.leave_type")}</TableColumn>
                      <TableColumn>{t("profile.col_date")}</TableColumn>
                      <TableColumn>{t("profile.col_status")}</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={t("profile.no_leaves")}>
                      {employeeRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="text-xs font-bold">
                            {t(`leave_modal.type_${req.type}`, req.type)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={req.status === "approved" ? "success" : req.status === "pending" ? "warning" : "danger"}
                              className="text-[10px] font-bold"
                            >
                              {t(`profile.${req.status === "approved" ? "approved" : req.status === "pending" ? "pending" : "rejected"}`)}
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab
              key="pay"
              title={
                <span className="flex items-center gap-2">
                  <CreditCard size={16} />
                  {t("profile.tab_pay")}
                </span>
              }
            >
              {!hasPay ? (
                <p className="rounded-2xl border border-dashed border-default-200 p-8 text-center text-sm text-default-400">
                  {t("profile.no_salary")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-3 rounded-3xl border border-default-100 bg-default-50/70 p-6 md:col-span-2">
                    {[
                      { label: t("profile.salary"), amount: basicSalary, color: "bg-primary" },
                      housingAllowance > 0 && { label: isAr ? "بدل السكن" : "Housing", amount: housingAllowance, color: "bg-success" },
                      transportAllowance > 0 && { label: isAr ? "بدل النقل" : "Transport", amount: transportAllowance, color: "bg-secondary" },
                      otherAllowances > 0 && { label: isAr ? "بدلات أخرى" : "Other", amount: otherAllowances, color: "bg-warning" },
                    ]
                      .filter(Boolean)
                      .map((row) => {
                        const item = row as { label: string; amount: number; color: string };
                        return (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className={`h-2 w-2 rounded-full ${item.color}`} />
                              {item.label}
                            </span>
                            <MoneyAmount amount={item.amount} />
                          </div>
                        );
                      })}
                    <div className="flex items-center justify-between border-t border-default-200 pt-3 text-sm font-black">
                      <span>{isAr ? "الإجمالي" : "Gross"}</span>
                      <MoneyAmount amount={grossSalary} className="text-primary" />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-success/10 px-4 py-3 font-black text-success">
                      <span>{isAr ? "الصافي بعد التأمينات" : "Net after GOSI"}</span>
                      <MoneyAmount amount={netSalary} />
                    </div>
                    <p className="text-[11px] text-default-400">
                      GOSI 9.75% — {numberFormatter.format(gosiDeduction)}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-default-100 bg-default-50/70 p-6">
                    <h4 className="flex items-center gap-2 text-sm font-black text-foreground">
                      <Building size={16} className="text-primary" />
                      {t("profile.bank")}
                    </h4>
                    {extra?.bankName || extra?.iban ? (
                      <>
                        {extra.bankName && <p className="text-sm font-bold">{extra.bankName}</p>}
                        {extra.iban && (
                          <p dir="ltr" className="rounded-xl border border-default-200 bg-background p-2 font-mono text-xs">
                            {extra.iban}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-default-400">{t("profile.no_documents")}</p>
                    )}
                  </div>
                </div>
              )}
            </Tab>

            <Tab
              key="documents"
              title={
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  {t("profile.tab_personal")}
                </span>
              }
            >
              {!hasDocuments ? (
                <p className="rounded-2xl border border-dashed border-default-200 p-8 text-center text-sm text-default-400">
                  {t("profile.no_documents")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {extra?.nationalId && (
                    <div className="rounded-3xl border border-default-100 bg-default-50/70 p-5">
                      <p className="text-xs font-bold text-default-400">{t("profile.national_id")}</p>
                      <p dir="ltr" className="mt-1 text-lg font-black">{extra.nationalId}</p>
                    </div>
                  )}
                  {extra?.iban && (
                    <div className="rounded-3xl border border-default-100 bg-default-50/70 p-5">
                      <p className="text-xs font-bold text-default-400">{t("profile.iban")}</p>
                      <p dir="ltr" className="mt-1 font-mono text-sm font-bold">{extra.iban}</p>
                    </div>
                  )}
                  {extra?.bankName && (
                    <div className="rounded-3xl border border-default-100 bg-default-50/70 p-5">
                      <p className="text-xs font-bold text-default-400">{t("profile.bank")}</p>
                      <p className="mt-1 text-lg font-black">{extra.bankName}</p>
                    </div>
                  )}
                </div>
              )}
            </Tab>

            <Tab
              key="skills_assets"
              title={
                <span className="flex items-center gap-2">
                  <Star size={16} />
                  {t("profile.tab_skills")}
                </span>
              }
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <GraduationCap size={18} className="text-primary" />
                    {t("profile.skills_competencies")}
                  </h4>
                  {(canManageEmployees || isOwnProfile) && (
                    <Button size="sm" variant="flat" onPress={onSkillsOpen} className="rounded-xl font-bold">
                      {t("profile.manage_skills")}
                    </Button>
                  )}
                </div>

                {!employee.skills?.length ? (
                  <p className="text-sm italic text-default-400">{t("profile.no_skills")}</p>
                ) : (
                  <div className="space-y-4">
                    {employee.skills.map((skill) => (
                      <div key={skill.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{skill.name}</span>
                          <span className="text-xs font-black text-primary">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} color="primary" size="sm" aria-label={skill.name} />
                      </div>
                    ))}
                  </div>
                )}

                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Package size={18} className="text-secondary" />
                  {t("profile.assigned_assets")}
                </h4>
                {employeeAssets.length === 0 ? (
                  <p className="text-sm italic text-default-400">{t("profile.no_assets")}</p>
                ) : (
                  employeeAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-2xl border border-default-100 bg-default-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                          {asset.category === "laptop" ? <Laptop size={18} /> : asset.category === "phone" ? <Smartphone size={18} /> : <Package size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{asset.name}</p>
                          <p className="text-xs text-default-400">
                            S/N: {asset.serialNumber} • {formatDate(asset.assignedDate as Date | string)}
                          </p>
                        </div>
                      </div>
                      <Chip size="sm" variant="flat" color={asset.status === "assigned" ? "success" : "warning"} className="font-bold capitalize">
                        {t(`statuses.${asset.status}`, asset.status)}
                      </Chip>
                    </div>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <Modal isOpen={photoOpen} onClose={() => setPhotoOpen(false)} size="lg" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <ImageIcon size={16} />
            {displayName}
          </ModalHeader>
          <ModalBody className="pb-6">
            {photo && <img src={photo} alt={displayName} className="mx-auto max-h-[70vh] rounded-2xl object-contain" />}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPhotoOpen(false)}>
              {t("profile.close_photo")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />

      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t("profile.edit_profile")}</ModalHeader>
              <ModalBody>
                <div className="space-y-4 py-2">
                  <Input label={t("profile.job_title")} variant="bordered" value={editData.jobTitle} onValueChange={(val) => setEditData({ ...editData, jobTitle: val })} />
                  <Input label={t("profile.department")} variant="bordered" value={editData.department} onValueChange={(val) => setEditData({ ...editData, department: val })} />
                  <Input label={t("profile.national_id")} variant="bordered" value={editData.nationalId} onValueChange={(val) => setEditData({ ...editData, nationalId: val })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" label={t("profile.salary")} variant="bordered" value={editData.salary} onValueChange={(val) => setEditData({ ...editData, salary: val })} />
                    <Input type="number" label={isAr ? "بدل السكن" : "Housing"} variant="bordered" value={editData.housingAllowance} onValueChange={(val) => setEditData({ ...editData, housingAllowance: val })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" label={isAr ? "بدل النقل" : "Transport"} variant="bordered" value={editData.transportAllowance} onValueChange={(val) => setEditData({ ...editData, transportAllowance: val })} />
                    <Input label={t("profile.bank")} variant="bordered" value={editData.bankName} onValueChange={(val) => setEditData({ ...editData, bankName: val })} />
                  </div>
                  <Input label={t("profile.iban")} variant="bordered" value={editData.iban} onValueChange={(val) => setEditData({ ...editData, iban: val })} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} isDisabled={updateMutation.isPending}>
                  {t("profile.cancel")}
                </Button>
                <Button color="primary" onPress={() => handleSaveEdit(onClose)} isLoading={updateMutation.isPending}>
                  {t("profile.save_changes")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ManageSkillsModal isOpen={isSkillsOpen} onOpenChange={onSkillsOpenChange} employee={employee} />

      <AssignAttendanceLocationModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        employee={employee}
        locations={workLocations}
        isSaving={assignLocation.isPending}
        onSave={async (payload) => {
          await assignLocation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
