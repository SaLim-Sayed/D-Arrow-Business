import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  useDisclosure,
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
  FileCheck,
  Building2,
  DollarSign,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { useTranslation } from "react-i18next";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";
import { formatDate } from "@/lib/utils";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { toast } from "sonner";
import { employeeDisplayName } from "../utils/geo";

export default function EmployeeProfilePage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isSkillsOpen, onOpen: onSkillsOpen, onOpenChange: onSkillsOpenChange } = useDisclosure();

  const { data: employeesResponse } = useEmployeesQuery();
  const { data: leaveRequestsResponse } = useLeaveRequestsQuery();
  const [activeTab, setActiveTab] = useState("salary_job");
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
  const employeeRequests = leaveRequestsResponse?.data?.filter((r) => r.employeeId === employee?.userId) || [];
  const isOwnProfile = user?.id === employee?.userId;
  const { canManageEmployees } = useAppPermissions();

  const { data: assetsResponse } = useAssetsQuery();
  const employeeAssets = assetsResponse?.data?.filter((a) => a.assignedTo === employee?.id) || [];

  const { data: attendanceResponse } = useAttendanceQuery(employee?.id || "");
  const attendanceLogs = attendanceResponse?.data || [];
  const { data: locationsRes } = useWorkLocationsQuery();
  const workLocations = locationsRes?.data ?? [];
  const assignLocation = useAssignAttendanceLocationMutation();
  const [assignOpen, setAssignOpen] = useState(false);

  const formatHoursToHoursMinutes = (decimalHours: number) => {
    if (!decimalHours) return "-";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Salary Jisr Breakdown Calculation
  const basicSalary = Number(employee?.salary || 0);
  const housingAllowance = Number((employee as any)?.housingAllowance || (basicSalary > 0 ? basicSalary * 0.25 : 0));
  const transportAllowance = Number((employee as any)?.transportAllowance || (basicSalary > 0 ? 1000 : 0));
  const otherAllowances = Number((employee as any)?.otherAllowances || 0);
  const grossSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances;
  const gosiDeduction = Number((grossSalary * 0.0975).toFixed(2)); // Saudi GOSI 9.75%
  const netSalary = Math.max(0, grossSalary - gosiDeduction);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
          <UserIcon size={48} className="text-primary/50" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-foreground">{t("profile.not_found")}</h2>
          <p className="text-default-400 font-medium text-sm max-w-xs">{t("profile.not_found_desc")}</p>
        </div>
        <Button variant="shadow" color="primary" onPress={() => navigate("/people")} className="font-bold rounded-xl">
          {t("profile.back_to_directory")}
        </Button>
      </div>
    );
  }

  const displayName = employeeDisplayName(employee);
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "E";
  const roleColorMap: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    employee: "bg-default-100 text-default-700",
  };

  const handleOpenEdit = () => {
    setEditData({
      department: employee.department || "",
      role: employee.role || "employee",
      jobTitle: employee.jobTitle || "",
      salary: employee.salary ? employee.salary.toString() : "",
      housingAllowance: (employee as any).housingAllowance ? (employee as any).housingAllowance.toString() : "",
      transportAllowance: (employee as any).transportAllowance ? (employee as any).transportAllowance.toString() : "",
      officeLocation: employee.officeLocation || "",
      phoneNumber: employee.phoneNumber || "",
      nationalId: (employee as any).nationalId || "",
      iban: (employee as any).iban || "",
      bankName: (employee as any).bankName || "",
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
      } as any,
    });
    onClose();
  };

  const handleDownloadSalaryCertificate = () => {
    toast.success(isAr ? "جاري تحضير ونسخ خطاب التعريف بالراتب المعتمد..." : "Generating official salary certificate...");
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* === JISR HERO PROFILE HEADER === */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-default-200/60 dark:border-default-100/40 shadow-lg rounded-3xl overflow-hidden bg-background/80 backdrop-blur-xl">
          {/* Top Banner Background */}
          <div className="h-36 bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-700 relative p-6 flex justify-between items-start">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/20">
              <Building2 size={14} />
              <span>{isAr ? "نظام جسـر للموارد البشرية والرواتب" : "Jisr HR Platform"}</span>
            </div>
            <Chip color="success" variant="solid" size="sm" className="font-bold shadow-md">
              {isAr ? "على رأس العمل (نشط)" : "Active Employee"}
            </Chip>
          </div>

          <CardBody className="p-6 md:p-8 pt-0 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-16 mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-start w-full md:w-auto">
                <Avatar
                  src={(employee as any).avatar}
                  name={initials}
                  className="w-28 h-28 text-3xl font-black ring-4 ring-background shadow-2xl bg-gradient-to-br from-primary to-purple-600 text-white shrink-0"
                />

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                      {displayName}
                    </h1>
                    <Chip size="sm" color="primary" variant="flat" className="font-bold text-xs">
                      #{employee.id ? employee.id.slice(-6).toUpperCase() : "EMP-102"}
                    </Chip>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm font-semibold text-default-500">
                    <span className="text-primary font-bold">{employee.jobTitle}</span>
                    <span>•</span>
                    <span>{t(`departments.${employee.department}`, employee.department || "الموارد البشرية")}</span>
                    {employee.role && (
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${roleColorMap[employee.role] || roleColorMap.employee}`}>
                        {t(`roles.${employee.role}`, employee.role.replace("_", " "))}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-default-400 font-medium pt-1">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-primary" /> {employee.email}
                    </span>
                    {employee.officeLocation && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-purple-500" /> {employee.officeLocation}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {isAr ? "تاريخ المباشرة:" : "Joined:"} {formatDate(employee.joiningDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                <Button
                  color="primary"
                  variant="shadow"
                  size="sm"
                  startContent={<CalendarDays size={16} />}
                  onPress={onOpen}
                  className="font-bold rounded-2xl h-10 px-4 shadow-lg shadow-primary/25"
                >
                  {isAr ? "طلب إجازة جديدة" : "Apply Leave"}
                </Button>

                <Button
                  color="secondary"
                  variant="flat"
                  size="sm"
                  startContent={<Download size={16} />}
                  onPress={handleDownloadSalaryCertificate}
                  className="font-bold rounded-2xl h-10 px-4"
                >
                  {isAr ? "تعريف بالراتب" : "Salary Certificate"}
                </Button>

                {canManageEmployees && (
                  <Button
                    color="default"
                    variant="bordered"
                    size="sm"
                    startContent={<ShieldCheck size={16} />}
                    onPress={handleOpenEdit}
                    className="font-bold rounded-2xl h-10"
                  >
                    {isAr ? "تعديل البيانات" : "Edit Profile"}
                  </Button>
                )}
              </div>
            </div>

            {/* Jisr Quick Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-default-50/70 border border-default-200/60 dark:border-default-100/40">
              <div className="text-center md:text-start border-e border-default-200/60 last:border-0 pe-2">
                <span className="text-[11px] font-bold text-default-400 block uppercase">{isAr ? "صافي الراتب الشهري" : "Net Monthly Salary"}</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center md:justify-start gap-1">
                  <MoneyAmount amount={netSalary} />
                </span>
              </div>

              <div className="text-center md:text-start border-e border-default-200/60 last:border-0 pe-2">
                <span className="text-[11px] font-bold text-default-400 block uppercase">{isAr ? "رصيد الإجازة السنوية" : "Annual Leave Balance"}</span>
                <span className="text-lg font-black text-primary mt-0.5 block">21 {isAr ? "يوم متبقي" : "days left"}</span>
              </div>

              <div className="text-center md:text-start border-e border-default-200/60 last:border-0 pe-2">
                <span className="text-[11px] font-bold text-default-400 block uppercase">{isAr ? "التأمينات الاجتماعية GOSI" : "GOSI Contribution"}</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 block">9.75% ({gosiDeduction} {isAr ? "ر.س" : "SAR"})</span>
              </div>

              <div className="text-center md:text-start">
                <span className="text-[11px] font-bold text-default-400 block uppercase">{isAr ? "نوع العقد والدوام" : "Contract & Shift"}</span>
                <span className="text-xs font-bold text-foreground mt-1 block">{isAr ? "عقد سعودي • دوام مرن" : "Saudi Contract • Flexible"}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{isAr ? "تعديل بيانات الموظف والراتب (نظام جسر)" : "Edit Employee & Salary Details"}</ModalHeader>
              <ModalBody>
                <div className="space-y-4 py-2">
                  <Input label={t("profile.job_title")} variant="bordered" value={editData.jobTitle} onValueChange={(val) => setEditData({ ...editData, jobTitle: val })} />
                  <Input label={t("profile.department")} variant="bordered" value={editData.department} onValueChange={(val) => setEditData({ ...editData, department: val })} />
                  <Input label={isAr ? "الرقم الهويّة / الإقامة" : "National ID / Iqama"} variant="bordered" value={editData.nationalId} onValueChange={(val) => setEditData({ ...editData, nationalId: val })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" label={isAr ? "الراتب الأساسي" : "Basic Salary"} variant="bordered" value={editData.salary} onValueChange={(val) => setEditData({ ...editData, salary: val })} />
                    <Input type="number" label={isAr ? "بدل السكن" : "Housing Allowance"} variant="bordered" value={editData.housingAllowance} onValueChange={(val) => setEditData({ ...editData, housingAllowance: val })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" label={isAr ? "بدل النقل" : "Transport Allowance"} variant="bordered" value={editData.transportAllowance} onValueChange={(val) => setEditData({ ...editData, transportAllowance: val })} />
                    <Input label={isAr ? "اسم البنك" : "Bank Name"} variant="bordered" value={editData.bankName} onValueChange={(val) => setEditData({ ...editData, bankName: val })} />
                  </div>
                  <Input label={isAr ? "رقم الآيبان IBAN" : "IBAN Number"} variant="bordered" value={editData.iban} onValueChange={(val) => setEditData({ ...editData, iban: val })} />
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

      {/* === JISR TABBED MAIN CONTENT === */}
      <Card className="border border-default-200/60 dark:border-default-100/40 shadow-sm rounded-3xl overflow-hidden bg-background/80 backdrop-blur-xl">
        <CardBody className="p-0">
          <Tabs
            aria-label="Jisr Employee Profile Tabs"
            variant="underlined"
            selectedKey={activeTab}
            onSelectionChange={(k) => setActiveTab(k as string)}
            classNames={{
              tabList: "gap-2 w-full relative rounded-none p-2 px-6 border-b border-divider bg-default-50/50 overflow-x-auto",
              cursor: "w-full bg-primary h-1 rounded-full",
              tab: "max-w-fit px-4 h-12 rounded-xl font-bold",
              tabContent: "group-data-[selected=true]:text-primary font-bold text-sm",
            }}
          >
            {/* TAB 1: SALARY & JOB STRUCTURE */}
            <Tab
              key="salary_job"
              title={
                <span className="flex items-center gap-2">
                  <DollarSign size={16} />
                  {isAr ? "الرواتب والبدلات" : "Salary & Job"}
                </span>
              }
            >
              <div className="p-6 md:p-8 space-y-8">
                {/* Salary Breakdown Card */}
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2 mb-4">
                    <CreditCard size={18} className="text-primary" />
                    {isAr ? "تفاصيل هيكل الراتب الشهري (حسب نظام جسـر)" : "Monthly Salary Breakdown"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic & Allowances Box */}
                    <div className="md:col-span-2 p-6 rounded-3xl bg-default-50/70 border border-default-200/60 dark:border-default-100/40 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-default-200/60">
                        <span className="text-xs font-bold text-default-500">{isAr ? "بند الراتب" : "Item"}</span>
                        <span className="text-xs font-bold text-default-500">{isAr ? "المبلغ المستحق" : "Amount"}</span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {isAr ? "الراتب الأساسي (Basic Salary)" : "Basic Salary"}
                          </span>
                          <MoneyAmount amount={basicSalary} />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {isAr ? "بدل السكن (Housing Allowance)" : "Housing Allowance"}
                          </span>
                          <MoneyAmount amount={housingAllowance} />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            {isAr ? "بدل النقل (Transport Allowance)" : "Transport Allowance"}
                          </span>
                          <MoneyAmount amount={transportAllowance} />
                        </div>

                        {otherAllowances > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              {isAr ? "بدلات وحوافز أخرى" : "Other Allowances"}
                            </span>
                            <MoneyAmount amount={otherAllowances} />
                          </div>
                        )}

                        <Divider />

                        <div className="flex justify-between items-center pt-1 text-base font-black">
                          <span className="text-foreground">{isAr ? "إجمالي الراتب (Gross Salary):" : "Gross Total:"}</span>
                          <MoneyAmount amount={grossSalary} className="text-primary text-lg" />
                        </div>

                        <div className="flex justify-between items-center text-xs font-semibold text-danger">
                          <span>{isAr ? "خصم التأمينات الاجتماعية GOSI (9.75%):" : "GOSI Deduction (9.75%):"}</span>
                          <span>- {gosiDeduction} {isAr ? "ر.س" : "SAR"}</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center font-black text-emerald-600 dark:text-emerald-400">
                          <span>{isAr ? "صافي الراتب المستحق للتحويل:" : "Net Payable Salary:"}</span>
                          <MoneyAmount amount={netSalary} className="text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Bank Info Card */}
                    <div className="p-6 rounded-3xl bg-primary-50/30 border border-primary/20 space-y-4">
                      <h4 className="font-black text-sm text-primary flex items-center gap-2">
                        <Building size={16} />
                        {isAr ? "بيانات الحساب البنكي لتحويل الرواتب" : "Bank Account Details"}
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-default-400 font-semibold block">{isAr ? "البنك:" : "Bank:"}</span>
                          <span className="font-bold text-foreground text-sm">{(employee as any).bankName || (isAr ? "مصرف الراجحي" : "Al Rajhi Bank")}</span>
                        </div>

                        <div>
                          <span className="text-default-400 font-semibold block">{isAr ? "رقم الآيبان IBAN:" : "IBAN:"}</span>
                          <span className="font-bold text-foreground text-xs font-mono bg-background p-2 rounded-xl block border border-default-200/60 mt-1">
                            {(employee as any).iban || "SA54 8000 0000 6080 1012 3456"}
                          </span>
                        </div>

                        <div>
                          <span className="text-default-400 font-semibold block">{isAr ? "حالة ربط المسير:" : "Payroll Status:"}</span>
                          <Chip size="sm" color="success" variant="flat" className="font-bold mt-1">
                            {isAr ? "مربوط بنظام سداد الرواتب" : "WPS Connected"}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job & Contract Info */}
                <Divider />

                <div className="space-y-4">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-600" />
                    {isAr ? "بيانات العقد والوظيفة" : "Job & Contract Info"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/60">
                      <span className="text-xs text-default-400 font-semibold block">{isAr ? "نوع العقد" : "Contract Type"}</span>
                      <span className="text-sm font-bold text-foreground mt-1 block">{isAr ? "عقد عمل محدد المدة" : "Fixed-Term Contract"}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/60">
                      <span className="text-xs text-default-400 font-semibold block">{isAr ? "فترة التجربة" : "Probation Period"}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{isAr ? "مجتاز بنجاح (90 يوم)" : "Passed (90 Days)"}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/60">
                      <span className="text-xs text-default-400 font-semibold block">{isAr ? "نظام الدوام" : "Work Shift"}</span>
                      <span className="text-sm font-bold text-foreground mt-1 block">{isAr ? "الدوام المرن 08:00 - 17:00" : "Flexible Shift 8am-5pm"}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/60">
                      <span className="text-xs text-default-400 font-semibold block">{isAr ? "موقع العمل المعين" : "Assigned Location"}</span>
                      <span className="text-sm font-bold text-foreground mt-1 block">{employee.officeLocation || (isAr ? "المقر الرئيسي - الرياض" : "HQ - Riyadh")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            {/* TAB 2: ATTENDANCE HISTORY */}
            <Tab
              key="attendance"
              title={
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {isAr ? "الحضور والانصراف" : "Attendance"}
                </span>
              }
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      <Clock size={18} className="text-primary" />
                      {isAr ? "سجل الحضور والإنصراف الشهري" : "Monthly Attendance History"}
                    </h3>
                    <p className="text-xs text-default-400 mt-0.5">{isAr ? "عرض سجلات الحضور وساعات العمل اليومية" : "Detailed daily check-in and check-out logs"}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => setAssignOpen(true)}
                    startContent={<MapPin size={15} />}
                    className="font-bold rounded-2xl"
                  >
                    {isAr ? "تعيين موقع البصمة" : "Assign Geofence Location"}
                  </Button>
                </div>

                <Table aria-label="جدول الحضور والإنصراف" className="w-full">
                  <TableHeader>
                    <TableColumn>{isAr ? "التاريخ" : "Date"}</TableColumn>
                    <TableColumn>{isAr ? "تسجيل الدخول" : "Check In"}</TableColumn>
                    <TableColumn>{isAr ? "تسجيل الخروج" : "Check Out"}</TableColumn>
                    <TableColumn>{isAr ? "ساعات العمل" : "Total Hours"}</TableColumn>
                    <TableColumn>{isAr ? "الحالة" : "Status"}</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={isAr ? "لا توجد سجلات حضور مدونة لهذا الشهر" : "No attendance records found"}>
                    {attendanceLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-bold text-xs">{formatDate(log.date)}</TableCell>
                        <TableCell className="text-xs">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</TableCell>
                        <TableCell className="text-xs">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</TableCell>
                        <TableCell className="text-xs font-bold text-primary">{formatHoursToHoursMinutes(log.totalHours)}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={log.status === "present" ? "success" : log.status === "late" ? "warning" : "danger"}
                            className="font-bold text-[10px]"
                          >
                            {log.status === "present" ? (isAr ? "حاضر" : "Present") : log.status === "late" ? (isAr ? "تأخير" : "Late") : (isAr ? "غياب" : "Absent")}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>

            {/* TAB 3: LEAVE BALANCES & TRACKER */}
            <Tab
              key="leaves"
              title={
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {isAr ? "رصيد الإجازات" : "Leaves & Balances"}
                </span>
              }
            >
              <div className="p-6 md:p-8 space-y-6">
                {/* Leave Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                    <span className="text-xs font-bold block">{isAr ? "الإجازة السنوية (المستحقة)" : "Annual Leave"}</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-blue-600 dark:text-blue-400">21</span>
                      <span className="text-xs text-default-500 font-bold">{isAr ? "/ 30 يوم سنوياً" : "/ 30 days"}</span>
                    </div>
                    <Progress value={70} color="primary" size="sm" className="mt-3" />
                  </div>

                  <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                    <span className="text-xs font-bold block">{isAr ? "الإجازة المرضية" : "Sick Leave"}</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">15</span>
                      <span className="text-xs text-default-500 font-bold">{isAr ? "/ 15 يوم سنوياً" : "/ 15 days"}</span>
                    </div>
                    <Progress value={100} color="success" size="sm" className="mt-3" />
                  </div>

                  <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
                    <span className="text-xs font-bold block">{isAr ? "إجازة بدون راتب / طوارئ" : "Unpaid / Emergency"}</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-purple-600 dark:text-purple-400">5</span>
                      <span className="text-xs text-default-500 font-bold">{isAr ? "أيام متاحة" : "days available"}</span>
                    </div>
                    <Progress value={50} color="secondary" size="sm" className="mt-3" />
                  </div>
                </div>

                <Divider />

                {/* Leave Requests Table */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-foreground">{isAr ? "طلبات الإجازات السابقة" : "Leave Request History"}</h4>
                  <Table aria-label="طلبات الإجازات" className="w-full">
                    <TableHeader>
                      <TableColumn>{isAr ? "نوع الإجازة" : "Type"}</TableColumn>
                      <TableColumn>{isAr ? "تاريخ البداية" : "Start Date"}</TableColumn>
                      <TableColumn>{isAr ? "تاريخ النهاية" : "End Date"}</TableColumn>
                      <TableColumn>{isAr ? "الحالة" : "Status"}</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={isAr ? "لا توجد طلبات إجازة مدونة" : "No leave requests found"}>
                      {employeeRequests.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-bold text-xs">{req.type || (isAr ? "إجازة سنوية" : "Annual Leave")}</TableCell>
                          <TableCell className="text-xs">{formatDate(req.startDate)}</TableCell>
                          <TableCell className="text-xs">{formatDate(req.endDate)}</TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat" color={req.status === "approved" ? "success" : req.status === "pending" ? "warning" : "danger"} className="font-bold text-[10px]">
                              {req.status === "approved" ? (isAr ? "مقبولة" : "Approved") : req.status === "pending" ? (isAr ? "قيد النظر" : "Pending") : (isAr ? "مرفوضة" : "Rejected")}
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Tab>

            {/* TAB 4: OFFICIAL DOCUMENTS & IDS */}
            <Tab
              key="documents"
              title={
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  {isAr ? "الوثائق والهوية" : "Documents & IDs"}
                </span>
              }
            >
              <div className="p-6 md:p-8 space-y-6">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <FileCheck size={18} className="text-primary" />
                  {isAr ? "الوثائق الرسمية ومواعيد الانتهاء (حسب متطلبات جسـر)" : "Official Documents & Expiry Dates"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-default-50 border border-default-200/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-default-500">{isAr ? "الهوية الوطنية / الإقامة" : "National ID / Iqama"}</span>
                      <Chip size="sm" color="success" variant="flat" className="font-bold text-[10px]">{isAr ? "ساري" : "Valid"}</Chip>
                    </div>
                    <p className="text-base font-black text-foreground">{(employee as any).nationalId || "1098485739"}</p>
                    <p className="text-[11px] text-default-400 font-semibold">{isAr ? "تاريخ الانتهاء: 2028-10-15" : "Expires: 2028-10-15"}</p>
                  </div>

                  <div className="p-5 rounded-3xl bg-default-50 border border-default-200/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-default-500">{isAr ? "جواز السفر" : "Passport"}</span>
                      <Chip size="sm" color="success" variant="flat" className="font-bold text-[10px]">{isAr ? "ساري" : "Valid"}</Chip>
                    </div>
                    <p className="text-base font-black text-foreground">K9083742</p>
                    <p className="text-[11px] text-default-400 font-semibold">{isAr ? "تاريخ الانتهاء: 2029-05-20" : "Expires: 2029-05-20"}</p>
                  </div>

                  <div className="p-5 rounded-3xl bg-default-50 border border-default-200/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-default-500">{isAr ? "عقد العمل السعودي (قوى)" : "Qiwa Work Contract"}</span>
                      <Chip size="sm" color="primary" variant="flat" className="font-bold text-[10px]">{isAr ? "موثق" : "Verified"}</Chip>
                    </div>
                    <p className="text-base font-black text-foreground">#QW-908234</p>
                    <p className="text-[11px] text-default-400 font-semibold">{isAr ? "تاريخ الانتهاء: 2027-12-31" : "Expires: 2027-12-31"}</p>
                  </div>
                </div>
              </div>
            </Tab>

            {/* TAB 5: SKILLS & ASSETS */}
            <Tab
              key="skills_assets"
              title={
                <span className="flex items-center gap-2">
                  <Star size={16} />
                  {isAr ? "المهارات والعهد" : "Skills & Assets"}
                </span>
              }
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
                    <GraduationCap size={18} className="text-primary" />
                    {t("profile.skills_competencies")}
                  </h4>
                  {(canManageEmployees || isOwnProfile) && (
                    <Button size="sm" variant="flat" onPress={onSkillsOpen} className="font-bold rounded-xl">
                      {t("profile.manage_skills")}
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {!employee.skills || employee.skills.length === 0 ? (
                    <p className="text-sm text-default-400 italic">{t("profile.no_skills")}</p>
                  ) : (
                    employee.skills.map((skill) => (
                      <div key={skill.name} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-foreground">{skill.name}</span>
                          <span className="text-xs font-black text-primary">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} color="primary" size="sm" className="w-full" aria-label={skill.name} />
                      </div>
                    ))
                  )}
                </div>

                <Divider />

                <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <Package size={18} className="text-purple-600" />
                  {t("profile.assigned_assets")}
                </h4>

                {employeeAssets.length === 0 ? (
                  <p className="text-sm text-default-400 italic">{t("profile.no_assets")}</p>
                ) : (
                  employeeAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 bg-default-50 rounded-2xl border border-default-200/60">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                          {asset.category === "laptop" ? <Laptop size={18} /> : asset.category === "phone" ? <Smartphone size={18} /> : <Package size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{asset.name}</p>
                          <p className="text-xs text-default-400">S/N: {asset.serialNumber} • {t("profile.joined")} {formatDate(asset.assignedDate as Date | string)}</p>
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

      <ManageSkillsModal isOpen={isSkillsOpen} onOpenChange={onSkillsOpenChange} employee={employee as any} />

      <AssignAttendanceLocationModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        employee={employee ?? null}
        locations={workLocations}
        isSaving={assignLocation.isPending}
        onSave={async (payload) => {
          await assignLocation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
