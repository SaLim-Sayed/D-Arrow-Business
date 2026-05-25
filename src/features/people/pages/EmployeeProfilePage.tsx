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
  Tooltip,
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  ChevronLeft,
  Mail,
  Phone,
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
  Target,
  GraduationCap,
  Laptop,
  Smartphone,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEmployeesQuery, useLeaveRequestsQuery, useAssetsQuery, useUpdateEmployeeMutation, useAttendanceQuery } from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";
import { ManageSkillsModal } from "../components/ManageSkillsModal";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, getDoc, doc } from "firebase/firestore";
import { useEffect } from "react";
import { Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useTranslation } from "react-i18next";

const statusColorMap: Record<string, "success" | "warning" | "danger" | "primary" | "default"> = {
  active: "success",
  onboarding: "primary",
  suspended: "warning",
  terminated: "danger",
};

export default function EmployeeProfilePage() {
  const { t } = useTranslation("people");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isSkillsOpen, onOpen: onSkillsOpen, onOpenChange: onSkillsOpenChange } = useDisclosure();
  const { data: employeesResponse } = useEmployeesQuery();
  const { data: leaveRequestsResponse } = useLeaveRequestsQuery();
  const [activeTab, setActiveTab] = useState("work");
  const updateMutation = useUpdateEmployeeMutation();
  const [editData, setEditData] = useState({ department: "", role: "", jobTitle: "", salary: "", officeLocation: "", phoneNumber: "" });

  const employee = employeesResponse?.data?.find((e) => e.id === id || e.userId === id);
  const employeeRequests = leaveRequestsResponse?.data?.filter((r) => r.employeeId === employee?.userId) || [];
  const isOwnProfile = user?.id === employee?.userId;
  const isManager = user?.role === "super_admin" || user?.role === "admin" || user?.role === "manager";

  const { data: assetsResponse } = useAssetsQuery();
  const employeeAssets = assetsResponse?.data?.filter(a => a.assignedTo === employee?.id) || [];

  const { data: attendanceResponse, isLoading: isLoadingAttendance } = useAttendanceQuery(employee?.id || "");
  const attendanceLogs = attendanceResponse?.data || [];

  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [isLoadingAppraisals, setIsLoadingAppraisals] = useState(true);

  useEffect(() => {
    if (!employee?.userId) return;
    const fetchAppraisals = async () => {
      setIsLoadingAppraisals(true);
      try {
        const q = query(collection(db, "performance_cycles"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const cyclesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const promises = cyclesData.map(async (cycle: any) => {
          const docSnap = await getDoc(doc(db, "performance_cycles", cycle.id, "appraisals", employee.userId));
          if (docSnap.exists()) {
            return { cycleName: cycle.name, cycleType: cycle.type, cycleDate: cycle.start, id: cycle.id, ...docSnap.data() };
          }
          return null;
        });
        const results = await Promise.all(promises);
        setAppraisals(results.filter(Boolean));
      } catch (error) {
        console.error("Error fetching appraisals:", error);
      } finally {
        setIsLoadingAppraisals(false);
      }
    };
    fetchAppraisals();
  }, [employee?.userId]);

  const formatHoursToHoursMinutes = (decimalHours: number) => {
    if (!decimalHours) return "-";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const leaveStats = {
    total: employeeRequests.length,
    approved: employeeRequests.filter((r) => r.status === "approved").length,
    pending: employeeRequests.filter((r) => r.status === "pending").length,
    rejected: employeeRequests.filter((r) => r.status === "rejected").length,
  };

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

  const initials = `${employee.firstName?.charAt(0) || ""}${employee.lastName?.charAt(0) || ""}`.toUpperCase();
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
      officeLocation: employee.officeLocation || "",
      phoneNumber: employee.phoneNumber || ""
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
        salary: editData.salary ? Number(editData.salary) : null,
        officeLocation: editData.officeLocation,
        phoneNumber: editData.phoneNumber,
      }
    }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      <Button
        variant="light"
        startContent={<ChevronLeft size={18} />}
        onPress={() => navigate("/people")}
        className="font-bold text-default-500"
      >
        {t("profile.back_to_directory")}
      </Button>

      {/* === PROFILE HEADER === */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-default-100/60 shadow-lg overflow-visible">
          <CardBody className="p-0">
            {/* Cover Banner */}
            <div className="relative h-44 rounded-t-2xl bg-gradient-to-r from-primary/40 via-violet-500/30 to-blue-500/20 overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 15% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(14,165,233,0.25) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(168,85,247,0.2) 0%, transparent 40%)" }} />
              {/* Floating decorative circles */}
              <div className="absolute top-6 right-12 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              <div className="absolute bottom-4 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg" />
              <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-white/10 rounded-full" />
            </div>

            <div className="px-6 md:px-8 pb-6">
              {/* Avatar + Name Row */}
              <div className="relative -mt-16 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 mb-6">
                <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  <div className="p-1 rounded-full bg-gradient-to-br from-primary via-violet-500 to-blue-500 shadow-2xl">
                    <Avatar
                      src={employee.avatarUrl}
                      fallback={initials}
                      className="w-28 h-28 text-3xl border-4 border-background"
                    />
                  </div>
                  <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-3 border-background shadow-lg ${employee.status === 'active' ? 'bg-success' : employee.status === 'onboarding' ? 'bg-primary' : 'bg-default-300'}`} />
                </motion.div>

                <div className="flex-1 md:pb-2 mt-2 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                        {employee.firstName} {employee.lastName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-primary font-bold text-sm">{employee.jobTitle}</span>
                        <span className="text-default-200">•</span>
                        <span className="text-default-500 font-medium text-sm">{employee.department}</span>
                        {employee.role && (
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${roleColorMap[employee.role] || roleColorMap.employee}`}>
                            {employee.role.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-default-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} /> {employee.email}
                        </span>
                        {employee.officeLocation && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} /> {employee.officeLocation}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} /> Joined {new Date(employee.joiningDate as any).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile && (
                        <Button color="primary" variant="shadow" size="sm" startContent={<CalendarDays size={15} />} onPress={onOpen} className="font-bold shadow-lg shadow-primary/25">
                          {t("profile.apply_leave")}
                        </Button>
                      )}
                      {isManager && (
                        <Button color="default" variant="flat" size="sm" startContent={<ShieldCheck size={15} />} className="font-bold" onPress={handleOpenEdit}>
                          {t("profile.edit_manage")}
                        </Button>
                      )}
                      <Tooltip content={t("profile.send_email")}>
                        <Button isIconOnly variant="flat" size="sm">
                          <Mail size={15} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t("profile.total_leaves"), value: leaveStats.total, color: "text-foreground", bg: "bg-default-50" },
                  { label: t("profile.approved"), value: leaveStats.approved, color: "text-success", bg: "bg-success/5" },
                  { label: t("profile.pending"), value: leaveStats.pending, color: "text-warning", bg: "bg-warning/5" },
                  { label: t("profile.rejected"), value: leaveStats.rejected, color: "text-danger", bg: "bg-danger/5" },
                ].map((stat) => (
                  <motion.div 
                    key={stat.label} 
                    whileHover={{ y: -2 }} 
                    className={`${stat.bg} rounded-2xl p-4 text-center border border-default-100/50 transition-shadow hover:shadow-md cursor-default`}
                  >
                    <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                    <p className="text-[10px] font-bold text-default-400 mt-1 uppercase tracking-widest">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />

      {/* Edit / Manage Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Edit Employee Details</ModalHeader>
              <ModalBody>
                <div className="space-y-4 py-2">
                  <Input
                    label="Job Title"
                    variant="bordered"
                    value={editData.jobTitle}
                    onValueChange={(val) => setEditData({ ...editData, jobTitle: val })}
                  />
                  <Input
                    label="Department"
                    variant="bordered"
                    value={editData.department}
                    onValueChange={(val) => setEditData({ ...editData, department: val })}
                  />
                  <Select
                    label="System Role"
                    variant="bordered"
                    selectedKeys={[editData.role]}
                    onSelectionChange={(keys) => setEditData({ ...editData, role: Array.from(keys)[0] as string })}
                  >
                    <SelectItem key="employee">Employee</SelectItem>
                    <SelectItem key="manager">Manager</SelectItem>
                    <SelectItem key="admin">Admin</SelectItem>
                  </Select>
                  <Input
                    label="Office Location"
                    variant="bordered"
                    value={editData.officeLocation}
                    onValueChange={(val) => setEditData({ ...editData, officeLocation: val })}
                  />
                  <Input
                    label="Phone Number"
                    variant="bordered"
                    value={editData.phoneNumber}
                    onValueChange={(val) => setEditData({ ...editData, phoneNumber: val })}
                  />
                  <Input
                    type="number"
                    label="Salary"
                    variant="bordered"
                    value={editData.salary}
                    onValueChange={(val) => setEditData({ ...editData, salary: val })}
                    startContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">$</span></div>}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} isDisabled={updateMutation.isPending}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => handleSaveEdit(onClose)} isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ManageSkillsModal isOpen={isSkillsOpen} onOpenChange={onSkillsOpenChange} employee={employee as any} />

      {/* === MAIN CONTENT + SIDEBAR === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabs Area */}
        <div className="lg:col-span-2">
          <Card className="border border-default-100 shadow-sm">
            <CardBody className="p-0">
              <Tabs
                aria-label="Profile tabs"
                variant="underlined"
                selectedKey={activeTab}
                onSelectionChange={(k) => setActiveTab(k as string)}
                classNames={{
                  tabList: "gap-0 w-full relative rounded-none p-0 px-6 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-4 h-12",
                  tabContent: "group-data-[selected=true]:text-primary font-bold text-sm",
                }}
              >
                <Tab key="work" title={<span className="flex items-center gap-1.5"><Briefcase size={15} />{t("profile.tab_work")}</span>}>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoItem icon={<Calendar size={16} />} label={t("profile.joined")} value={new Date(employee.joiningDate as any).toLocaleDateString()} />
                      <InfoItem icon={<Briefcase size={16} />} label={t("profile.employment_type")} value={t("profile.full_time")} />
                      <InfoItem icon={<ShieldCheck size={16} />} label={t("profile.role")} value={employee.role ? employee.role.replace("_", " ") : "Employee"} />
                      <InfoItem icon={<UserIcon size={16} />} label={t("profile.reporting_to")} value="Sarah (CEO)" />
                      {employee.salary && (
                        <InfoItem icon={<TrendingUp size={16} />} label={t("profile.salary")} value={`${employee.currency || "USD"} ${employee.salary.toLocaleString()}`} />
                      )}
                    </div>
                    <Divider />
                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-primary" />
                        {t("profile.experience_summary")}
                      </h4>
                      <p className="text-sm text-default-600 leading-relaxed">
                        {t("profile.experience_desc", { jobTitle: employee.jobTitle, department: employee.department })}
                      </p>
                    </div>
                    {employee.permissions && employee.permissions.length > 0 && (
                      <>
                        <Divider />
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <ShieldCheck size={16} className="text-violet-500" />
                            {t("profile.permissions")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {employee.permissions.map((p) => (
                              <Chip key={p} size="sm" variant="flat" color="secondary" className="capitalize font-semibold">
                                {p.replace(/_/g, " ")}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Tab>

                <Tab key="personal" title={<span className="flex items-center gap-1.5"><UserIcon size={15} />{t("profile.tab_personal")}</span>}>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoItem icon={<Mail size={16} />} label="Email Address" value={employee.email} />
                      <InfoItem icon={<Phone size={16} />} label="Phone Number" value={employee.phoneNumber || "Not provided"} />
                      <InfoItem icon={<MapPin size={16} />} label="Office Location" value={employee.officeLocation || "Remote"} />
                    </div>
                  </div>
                </Tab>

                <Tab key="skills" title={<span className="flex items-center gap-1.5"><Star size={15} />{t("profile.tab_skills")}</span>}>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <GraduationCap size={16} className="text-primary" />
                        Skill Proficiency
                      </h4>
                      {(isManager || isOwnProfile) && (
                        <Button size="sm" variant="flat" onPress={onSkillsOpen} className="font-bold">
                          Manage Skills
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(!employee.skills || employee.skills.length === 0) ? (
                        <p className="text-sm text-default-500">No skills added yet.</p>
                      ) : (
                        employee.skills.map((skill) => (
                          <div key={skill.name} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold">{skill.name}</span>
                              <span className="text-xs font-black text-primary">{skill.level}%</span>
                            </div>
                            <Progress
                              value={skill.level}
                              color="primary"
                              size="sm"
                              className="w-full"
                              aria-label={skill.name}
                            />
                          </div>
                        ))
                      )}
                    </div>
                    {/* <Divider />
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      Education
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-default-50 rounded-xl border border-default-100">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><GraduationCap size={18} /></div>
                        <div>
                          <p className="font-bold text-sm">B.Sc. Computer Science</p>
                          <p className="text-xs text-default-500">Cairo University • 2018 – 2022</p>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </Tab>

                <Tab key="assets" title={<span className="flex items-center gap-1.5"><Package size={15} />{t("profile.tab_assets")}</span>}>
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Package size={16} className="text-primary" />
                      Assigned Equipment
                    </h4>
                    {employeeAssets.length === 0 ? (
                      <p className="text-sm text-default-500">No assets assigned yet.</p>
                    ) : (
                      employeeAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-100 hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                              {asset.category === "laptop" ? <Laptop size={18} /> : asset.category === "phone" ? <Smartphone size={18} /> : <Package size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{asset.name}</p>
                              <p className="text-xs text-default-500">S/N: {asset.serialNumber} • Assigned {new Date(asset.assignedDate as Date | string).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Chip size="sm" variant="flat" color={asset.status === 'assigned' ? 'success' : 'warning'} className="font-bold capitalize">{asset.status}</Chip>
                        </div>
                      ))
                    )}
                  </div>
                </Tab>

                <Tab key="performance" title={<span className="flex items-center gap-1.5"><Target size={15} />{t("profile.tab_performance")}</span>}>
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" />
                      Appraisal History
                    </h4>
                    {isLoadingAppraisals ? (
                      <p className="text-sm text-default-500 animate-pulse">Loading appraisals...</p>
                    ) : appraisals.length === 0 ? (
                      <p className="text-sm text-default-500">No performance reviews yet.</p>
                    ) : (
                      appraisals.map((appraisal, idx) => (
                        <div key={idx} className="p-4 bg-default-50 rounded-xl border border-default-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-sm">{appraisal.cycleName}</p>
                              <p className="text-xs text-default-500">{appraisal.cycleDate ? new Date(appraisal.cycleDate).toLocaleDateString() : ''}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-xl font-black text-primary">Grade {appraisal.grade || '?'}</p>
                              <p className="text-xs font-bold text-default-600">{appraisal.points || 0} Points</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Tab>

                <Tab key="attendance" title={<span className="flex items-center gap-1.5"><Clock size={15} />{t("profile.tab_attendance")}</span>}>
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      Daily Time Logs
                    </h4>
                    {isLoadingAttendance ? (
                      <p className="text-sm text-default-500 animate-pulse">Loading attendance logs...</p>
                    ) : attendanceLogs.length === 0 ? (
                      <p className="text-sm text-default-500">No time logs available.</p>
                    ) : (
                      <Table aria-label="Attendance time logs" classNames={{ wrapper: "shadow-none border border-default-100" }}>
                        <TableHeader>
                          <TableColumn>DATE</TableColumn>
                          <TableColumn>CHECK IN</TableColumn>
                          <TableColumn>CHECK OUT</TableColumn>
                          <TableColumn>HOURS</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {attendanceLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium text-sm">{new Date(log.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm">
                                {log.checkIn ? new Date(log.checkIn as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.checkOut ? new Date(log.checkOut as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                              </TableCell>
                              <TableCell className="font-bold text-sm">
                                {log.totalHours ? formatHoursToHoursMinutes(log.totalHours) : "-"}
                              </TableCell>
                              <TableCell>
                                <Chip size="sm" variant="flat" color={log.status === 'present' ? 'success' : log.status === 'late' ? 'warning' : 'danger'} className="capitalize font-bold">
                                  {log.status.replace('-', ' ')}
                                </Chip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </Tab>

                <Tab key="leaves" title={<span className="flex items-center gap-1.5"><CalendarDays size={15} />{t("profile.tab_leaves")}</span>}>
                  <div className="p-6 space-y-4">
                    {employeeRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <CalendarDays size={40} className="text-default-300" />
                        <p className="text-default-500 font-medium">No leave requests found.</p>
                        {isOwnProfile && (
                          <Button size="sm" color="primary" variant="flat" onPress={onOpen}>Apply for Leave</Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employeeRequests.map((req) => (
                          <div key={req.id} className="flex items-start justify-between p-4 bg-default-50 rounded-xl border border-default-100 hover:border-primary/20 transition-colors">
                            <div className="flex items-start gap-3">
                              {req.status === "approved" ? (
                                <CheckCircle2 size={18} className="text-success mt-0.5 shrink-0" />
                              ) : req.status === "rejected" ? (
                                <XCircle size={18} className="text-danger mt-0.5 shrink-0" />
                              ) : (
                                <Clock size={18} className="text-warning mt-0.5 shrink-0" />
                              )}
                              <div>
                                <p className="font-bold text-sm capitalize">{req.type} Leave</p>
                                <p className="text-xs text-default-500 mt-0.5">
                                  {new Date(req.startDate as any).toLocaleDateString()} → {new Date(req.endDate as any).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-default-600 mt-1.5 max-w-xs">{req.reason}</p>
                              </div>
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"}
                              className="capitalize font-bold shrink-0"
                            >
                              {req.status}
                            </Chip>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>

        {/* === SIDEBAR === */}
        <div className="space-y-5">
          {/* Status Card */}
          <Card className="border border-default-100/60 shadow-sm rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/30 to-violet-500/10" />
            <CardBody className="p-5 space-y-4">
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">{t("profile.status")}</h4>
              <Chip
                color={statusColorMap[employee.status] || "default"}
                variant="flat"
                className="capitalize font-bold"
              >
                {employee.status}
              </Chip>
              <Divider />
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">{t("profile.employee_id")}</p>
                  <p className="font-mono text-sm font-black bg-default-50 inline-block px-2.5 py-1 rounded-lg">EMP-{employee.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">{t("profile.department")}</p>
                  <p className="text-sm font-bold">{employee.department}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">{t("profile.role")}</p>
                  <p className="text-sm font-bold capitalize">{(employee.role || "employee").replace("_", " ")}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {employee.status === 'onboarding' && employee.onboardingTasks && employee.onboardingTasks.length > 0 && (
            <Card className="border border-primary/20 shadow-sm rounded-2xl bg-primary/5">
              <CardBody className="p-5 space-y-3">
                <h4 className="font-black text-[10px] text-primary uppercase tracking-[0.15em]">Onboarding Checklist</h4>
                <div className="space-y-2">
                  {employee.onboardingTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <Checkbox isSelected={task.isCompleted} size="sm" color="primary">
                        <span className={`text-sm ${task.isCompleted ? 'line-through text-default-400' : 'text-foreground font-medium'}`}>{task.task}</span>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Contact Card */}
          <Card className="border border-default-100/60 shadow-sm rounded-2xl">
            <CardBody className="p-5 space-y-3">
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">{t("profile.contact")}</h4>
              <a href={`mailto:${employee.email}`} className="flex items-center gap-2.5 text-sm text-primary font-bold hover:underline group">
                <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                  <Mail size={13} />
                </div>
                {employee.email}
              </a>
              {employee.phoneNumber && (
                <p className="flex items-center gap-2.5 text-sm font-medium text-default-600">
                  <div className="p-1.5 bg-default-100 rounded-lg">
                    <Phone size={13} className="text-default-500" />
                  </div>
                  {employee.phoneNumber}
                </p>
              )}
              {employee.officeLocation && (
                <p className="flex items-center gap-2.5 text-sm font-medium text-default-600">
                  <div className="p-1.5 bg-default-100 rounded-lg">
                    <MapPin size={13} className="text-default-500" />
                  </div>
                  {employee.officeLocation}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card className="border border-default-100/60 shadow-sm rounded-2xl">
            <CardBody className="p-5 space-y-3">
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">{t("profile.leave_summary")}</h4>
              {[
                { label: t("profile.total_requests"), value: leaveStats.total, color: "text-foreground" },
                { label: t("profile.approved"), value: leaveStats.approved, color: "text-success" },
                { label: t("profile.pending"), value: leaveStats.pending, color: "text-warning" },
                { label: t("profile.rejected"), value: leaveStats.rejected, color: "text-danger" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-default-500">{s.label}</span>
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-default-100 rounded-lg text-default-500 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-default-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
