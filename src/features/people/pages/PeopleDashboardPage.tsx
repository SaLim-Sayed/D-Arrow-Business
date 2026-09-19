import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalContent,
  Skeleton,
  Tab,
  Tabs,
  useDisclosure,
} from "@heroui/react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  LayoutGrid,
  List,
  MapPin,
  Megaphone,
  Network,
  Palmtree,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
  UserCheck,
  UserCog,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeCard } from "../components/EmployeeCard";
import { EmployeeTable } from "../components/EmployeeTable";
import { OrgChart } from "../components/OrgChart";
import { HireEmployeeModal } from "../components/HireEmployeeModal";
import {
  TerminateEmployeeModal,
  type TerminateAction,
} from "../components/TerminateEmployeeModal";
import {
  useAnnouncementsQuery,
  useDeleteEmployeeMutation,
  useEmployeesQuery,
  useOffboardEmployeeMutation,
} from "../hooks/use-people";
import type { Employee } from "../types/people.types";
import { employeeDisplayName } from "../utils/geo";
import { useMemo, useState } from "react";
import { TimeTrackerWidget } from "../components/TimeTrackerWidget";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--heroui-primary))",
  "hsl(var(--heroui-success))",
  "hsl(var(--heroui-warning))",
  "hsl(var(--heroui-danger))",
  "hsl(var(--heroui-secondary))",
  "#a1a1aa",
];

type MainTab = "directory" | "org-chart";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-default-200 bg-content1 px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-bold text-default-700">
        {label || payload[0].name}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="capitalize text-default-500">{entry.name}</span>
          <span className="font-bold text-default-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function PeopleDashboardPage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: employeesResponse, isLoading } = useEmployeesQuery();
  const offboardMutation = useOffboardEmployeeMutation();
  const deleteEmployeeMutation = useDeleteEmployeeMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<MainTab>("directory");
  const { data: announcementsResponse } = useAnnouncementsQuery();
  const announcements = announcementsResponse?.data || [];

  const {
    isOpen: isOffboardOpen,
    onOpen: onOffboardOpen,
    onOpenChange: onOffboardOpenChange,
  } = useDisclosure();
  const [selectedEmployeeToOffboard, setSelectedEmployeeToOffboard] =
    useState<Employee | null>(null);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [selectedEmployeeToDelete, setSelectedEmployeeToDelete] =
    useState<Employee | null>(null);

  const handleOffboardClick = (employee: Employee) => {
    setSelectedEmployeeToOffboard(employee);
    onOffboardOpen();
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployeeToDelete(employee);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployeeToDelete) return;
    await deleteEmployeeMutation.mutateAsync(selectedEmployeeToDelete.id);
    onDeleteOpenChange();
    setSelectedEmployeeToDelete(null);
  };

  const handleOffboardConfirm = async ({
    type,
    reason,
  }: {
    type: TerminateAction;
    reason: string;
  }) => {
    if (!selectedEmployeeToOffboard) return;
    await offboardMutation.mutateAsync({
      employeeId: selectedEmployeeToOffboard.id,
      status: type,
      reason,
    });
  };

  const { canManageEmployees } = useAppPermissions();
  const employees = employeesResponse?.data || [];

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        employeeDisplayName(e, i18n.language).toLowerCase().includes(q) ||
        (e.nameAr || "").toLowerCase().includes(q) ||
        (e.jobTitle || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q)
    );
  }, [employees, searchQuery, i18n.language]);

  const activeCount = employees.filter((e) => e.status === "active").length;
  const onboardingCount = employees.filter(
    (e) => e.status === "onboarding"
  ).length;
  const departmentCount = useMemo(
    () =>
      new Set(
        employees.map((e) => e.department).filter((d): d is string => Boolean(d))
      ).size,
    [employees]
  );

  const departmentData = useMemo(() => {
    const counts = employees.reduce(
      (acc, emp) => {
        const dept = emp.department || t("dashboard.unassigned");
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts).map(([name, value], index) => ({
      name: t(`departments.${name}`, t(`departments.${name.toUpperCase()}`, name)),
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [employees, t]);

  const statusData = useMemo(() => {
    const counts = employees.reduce(
      (acc, emp) => {
        const status = emp.status || "active";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts).map(([status, count]) => ({
      key: status,
      name: t(`statuses.${status}`, status),
      count,
    }));
  }, [employees, t]);

  const metrics = [
    {
      key: "total",
      label: t("dashboard.metric_total"),
      value: employees.length,
      icon: Users,
      className: "bg-primary/10 text-primary",
      onPress: () => setActiveTab("directory"),
    },
    {
      key: "active",
      label: t("dashboard.metric_active"),
      value: activeCount,
      icon: UserCheck,
      className: "bg-success/10 text-success",
      onPress: () => setActiveTab("directory"),
    },
    {
      key: "onboarding",
      label: t("dashboard.metric_onboarding"),
      value: onboardingCount,
      icon: UserCog,
      className: "bg-warning/10 text-warning",
      onPress: () => setActiveTab("directory"),
    },
    {
      key: "departments",
      label: t("dashboard.metric_departments"),
      value: departmentCount,
      icon: Building2,
      className: "bg-secondary/10 text-secondary",
      onPress: () => setActiveTab("org-chart"),
    },
  ];

  const navItems = [
    {
      key: "directory",
      title: t("dashboard.nav_directory"),
      desc: t("dashboard.nav_directory_desc"),
      icon: Users,
      count: String(employees.length),
      onPress: () => setActiveTab("directory"),
    },
    {
      key: "leave",
      title: t("dashboard.nav_leave"),
      desc: t("dashboard.nav_leave_desc"),
      icon: CalendarDays,
      onPress: () => navigate("/people/leave"),
    },
    {
      key: "approvals",
      title: t("dashboard.nav_approvals"),
      desc: t("dashboard.nav_approvals_desc"),
      icon: ShieldCheck,
      onPress: () => navigate("/people/approvals"),
    },
    {
      key: "performance",
      title: t("dashboard.nav_performance"),
      desc: t("dashboard.nav_performance_desc"),
      icon: Target,
      onPress: () => navigate("/people/performance"),
    },
    {
      key: "timesheets",
      title: t("dashboard.nav_timesheets"),
      desc: t("dashboard.nav_timesheets_desc"),
      icon: FileSpreadsheet,
      onPress: () => navigate("/people/timesheets"),
    },
    ...(canManageEmployees
      ? [
          {
            key: "attendance",
            title: t("dashboard.nav_attendance"),
            desc: t("dashboard.nav_attendance_desc"),
            icon: MapPin,
            onPress: () => navigate("/people/attendance-settings"),
          },
        ]
      : []),
    {
      key: "org",
      title: t("dashboard.nav_org"),
      desc: t("dashboard.nav_org_desc"),
      icon: Network,
      onPress: () => setActiveTab("org-chart"),
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 pb-10 animate-in fade-in duration-300 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("dashboard.title")}
            </h1>
            <Chip size="sm" variant="flat" color="primary" className="font-semibold">
              {employees.length} {t("dashboard.members")}
            </Chip>
          </div>
          <p className="max-w-xl text-sm text-default-500">
            {t("dashboard.subtitle")}
          </p>
        </div>
        {canManageEmployees && (
          <Button
            color="primary"
            startContent={<UserPlus size={18} />}
            onPress={onOpen}
            className="h-11 w-full rounded-xl px-5 font-semibold sm:w-auto sm:shrink-0"
          >
            {t("dashboard.new_hire")}
          </Button>
        )}
      </div>

      <HireEmployeeModal isOpen={isOpen} onOpenChange={onOpenChange} />
      <TerminateEmployeeModal
        isOpen={isOffboardOpen}
        onOpenChange={onOffboardOpenChange}
        employee={selectedEmployeeToOffboard}
        onConfirm={handleOffboardConfirm}
      />
      <Modal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        size="md"
        classNames={{ backdrop: "backdrop-blur-sm" }}
      >
        <ModalContent className="rounded-2xl border border-default-100 p-2">
          {(onClose) => (
            <div
              dir={isAr ? "rtl" : "ltr"}
              className="space-y-4 p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-danger-500/20 bg-danger-500/10 text-danger">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("dashboard.delete_title")}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-default-500">
                  {t("dashboard.delete_confirm", {
                    name: selectedEmployeeToDelete
                      ? employeeDisplayName(
                          selectedEmployeeToDelete,
                          i18n.language
                        )
                      : "",
                  })}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="rounded-xl font-semibold"
                >
                  {t("dashboard.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDelete}
                  isLoading={deleteEmployeeMutation.isPending}
                  startContent={<Trash2 size={16} />}
                  className="rounded-xl font-semibold"
                >
                  {t("dashboard.delete_confirm_btn")}
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ key, label, value, icon: Icon, className, onPress }) => (
          <button
            key={key}
            type="button"
            onClick={onPress}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-default-200 bg-content1 px-4 py-3 text-start shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <div className={cn("rounded-lg p-2.5", className)}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-default-400">
                {label}
              </p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {value}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TimeTrackerWidget variant="full" />
        </div>
        <Card className="border border-default-200 bg-content1 shadow-sm">
          <CardBody className="flex flex-col justify-center gap-3 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <CalendarDays size={16} />
              </span>
              {t("dashboard.quick_actions")}
            </h3>
            <div className="space-y-2">
              <QuickActionButton
                label={t("dashboard.apply_leave")}
                icon={<Palmtree size={15} />}
                onPress={() => navigate("/people/leave")}
                color="primary"
              />
              <QuickActionButton
                label={t("dashboard.view_approvals")}
                icon={<ClipboardList size={15} />}
                onPress={() => navigate("/people/approvals")}
                color="secondary"
              />
              <QuickActionButton
                label={t("dashboard.my_profile")}
                icon={<UserCircle size={15} />}
                onPress={() => navigate("/profile")}
                color="default"
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {navItems.map((item) => (
          <NavCard
            key={item.key}
            title={item.title}
            desc={item.desc}
            icon={<item.icon size={18} />}
            count={item.count}
            onPress={item.onPress}
            active={
              (item.key === "directory" && activeTab === "directory") ||
              (item.key === "org" && activeTab === "org-chart")
            }
          />
        ))}
      </div>

      {announcements.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5 shadow-sm">
          <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="shrink-0 rounded-xl bg-primary/15 p-3 text-primary">
                <Megaphone size={20} />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {t("dashboard.announcement")}
                </p>
                <p className="truncate font-bold text-foreground">
                  {announcements[0].title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-default-500">
                  {announcements[0].content}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              className="shrink-0 font-semibold"
            >
              {t("dashboard.view_all")}
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-default-200 bg-content1 shadow-sm">
          <CardHeader className="border-b border-default-100 px-5 py-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("dashboard.chart_departments")}
            </h3>
          </CardHeader>
          <CardBody className="h-[280px] p-4">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-default-400">
                {t("dashboard.no_chart_data")}
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-default-200 bg-content1 shadow-sm">
          <CardHeader className="border-b border-default-100 px-5 py-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("dashboard.chart_status")}
            </h3>
          </CardHeader>
          <CardBody className="h-[280px] p-4">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-default-200"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-default-400"
                    dy={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-default-400"
                    width={28}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          entry.key === "terminated"
                            ? "hsl(var(--heroui-danger))"
                            : entry.key === "active"
                              ? "hsl(var(--heroui-success))"
                              : entry.key === "onboarding"
                                ? "hsl(var(--heroui-primary))"
                                : "hsl(var(--heroui-warning))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-default-400">
                {t("dashboard.no_chart_data")}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Tabs
        aria-label="HR Operations"
        color="primary"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as MainTab)}
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary font-semibold",
        }}
      >
        <Tab
          key="directory"
          title={
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{t("dashboard.tab_directory")}</span>
              <Chip
                size="sm"
                variant="flat"
                className="h-5 min-w-0 px-1.5 text-[10px] font-bold"
              >
                {activeCount}
              </Chip>
            </div>
          }
        >
          <div className="space-y-5 pt-5">
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <Input
                isClearable
                className="w-full sm:max-w-sm"
                placeholder={t("dashboard.search_placeholder")}
                startContent={<Search className="text-default-300" size={18} />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                classNames={{
                  inputWrapper: "border border-default-200 bg-content1 shadow-none",
                }}
              />
              <div className="flex items-center justify-end gap-2">
                <div className="flex rounded-xl bg-default-100 p-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant={viewMode === "grid" ? "solid" : "light"}
                    color={viewMode === "grid" ? "primary" : "default"}
                    onPress={() => setViewMode("grid")}
                    className="rounded-lg"
                    aria-label={t("dashboard.view_grid")}
                  >
                    <LayoutGrid size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant={viewMode === "table" ? "solid" : "light"}
                    color={viewMode === "table" ? "primary" : "default"}
                    onPress={() => setViewMode("table")}
                    className="rounded-lg"
                    aria-label={t("dashboard.view_table")}
                  >
                    <List size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default-200 py-16">
                <div className="rounded-full bg-default-100 p-4">
                  <Users size={28} className="text-default-400" />
                </div>
                <p className="font-semibold text-default-600">
                  {t("dashboard.no_employees")}
                </p>
                <p className="text-sm text-default-400">
                  {t("dashboard.try_adjusting")}
                </p>
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setSearchQuery("")}
                  >
                    {t("extra.clear_filters")}
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEmployees.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
                  >
                    <EmployeeCard
                      employee={employee}
                      onClick={() => navigate(`/people/${employee.id}`)}
                      onDelete={handleDeleteClick}
                      onOffboard={handleOffboardClick}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmployeeTable
                employees={filteredEmployees}
                onView={(emp) => navigate(`/people/${emp.id}`)}
                onDelete={handleDeleteClick}
              />
            )}
          </div>
        </Tab>

        <Tab
          key="org-chart"
          title={
            <div className="flex items-center gap-2">
              <Network size={16} />
              <span>{t("dashboard.tab_org")}</span>
            </div>
          }
        >
          <div className="pt-5">
            <OrgChart
              employees={employees}
              onSelect={(emp) => navigate(`/people/${emp.id}`)}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  onPress,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  color: "primary" | "secondary" | "default";
}) {
  return (
    <Button
      color={color}
      variant="flat"
      className="h-11 w-full justify-start rounded-xl font-semibold"
      onPress={onPress}
      startContent={
        <span className="rounded-md bg-default-100/80 p-1.5">{icon}</span>
      }
      endContent={
        <ArrowRight size={14} className="ms-auto opacity-50 rtl:rotate-180" />
      }
    >
      {label}
    </Button>
  );
}

function NavCard({
  title,
  desc,
  icon,
  count,
  onPress,
  active,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  count?: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border bg-content1 p-4 text-start transition-colors",
        active
          ? "border-primary/40 bg-primary/[0.04]"
          : "border-default-200 hover:border-primary/30 hover:bg-default-50"
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-xl p-2.5",
          active
            ? "bg-primary/15 text-primary"
            : "bg-default-100 text-default-600 group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold text-foreground">{title}</h3>
          {count && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
              {count}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-default-400">{desc}</p>
      </div>
      <ArrowRight
        size={14}
        className="shrink-0 text-default-300 transition-colors group-hover:text-primary rtl:rotate-180"
      />
    </button>
  );
}
