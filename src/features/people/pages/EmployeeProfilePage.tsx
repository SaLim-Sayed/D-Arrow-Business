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
  Award,
  GraduationCap,
  Laptop,
  Smartphone,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEmployeesQuery, useLeaveRequestsQuery, useAssetsQuery, usePerformanceReviewsQuery } from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";

// --- Mock data for Skills ---
const SKILLS_DATA = [
  { name: "React & TypeScript", level: 92 },
  { name: "Firebase / Backend", level: 78 },
  { name: "Product Design", level: 65 },
  { name: "Team Leadership", level: 85 },
];

const statusColorMap: Record<string, "success" | "warning" | "danger" | "primary" | "default"> = {
  active: "success",
  onboarding: "primary",
  suspended: "warning",
  terminated: "danger",
};

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: employeesResponse } = useEmployeesQuery();
  const { data: leaveRequestsResponse } = useLeaveRequestsQuery();
  const [activeTab, setActiveTab] = useState("work");

  const employee = employeesResponse?.data?.find((e) => e.id === id || e.userId === id);
  const employeeRequests = leaveRequestsResponse?.data?.filter((r) => r.employeeId === employee?.userId) || [];
  const isOwnProfile = user?.id === employee?.userId;
  const isManager = user?.role === "super_admin" || user?.role === "admin" || user?.role === "manager";

  const { data: assetsResponse } = useAssetsQuery();
  const { data: performanceResponse } = usePerformanceReviewsQuery(employee?.id || "");
  const employeeAssets = assetsResponse?.data?.filter(a => a.assignedTo === employee?.id) || [];
  const employeeReviews = performanceResponse?.data || [];

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
          <h2 className="text-xl font-black text-foreground">Employee Not Found</h2>
          <p className="text-default-400 font-medium text-sm max-w-xs">The employee you're looking for doesn't exist or may have been removed.</p>
        </div>
        <Button variant="shadow" color="primary" onPress={() => navigate("/people")} className="font-bold rounded-xl">
          Back to Directory
        </Button>
      </div>
    );
  }

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
  const roleColorMap: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    employee: "bg-default-100 text-default-700",
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      <Button
        variant="light"
        startContent={<ChevronLeft size={18} />}
        onPress={() => navigate("/people")}
        className="font-bold text-default-500"
      >
        Back to Directory
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
                          Apply Leave
                        </Button>
                      )}
                      {isManager && (
                        <Button color="default" variant="flat" size="sm" startContent={<ShieldCheck size={15} />} className="font-bold">
                          Edit / Manage
                        </Button>
                      )}
                      <Tooltip content="Send Email">
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
                  { label: "Total Leaves", value: leaveStats.total, color: "text-foreground", bg: "bg-default-50" },
                  { label: "Approved", value: leaveStats.approved, color: "text-success", bg: "bg-success/5" },
                  { label: "Pending", value: leaveStats.pending, color: "text-warning", bg: "bg-warning/5" },
                  { label: "Rejected", value: leaveStats.rejected, color: "text-danger", bg: "bg-danger/5" },
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
                <Tab key="work" title={<span className="flex items-center gap-1.5"><Briefcase size={15} />Work</span>}>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoItem icon={<Calendar size={16} />} label="Joining Date" value={new Date(employee.joiningDate as any).toLocaleDateString()} />
                      <InfoItem icon={<Briefcase size={16} />} label="Employment Type" value="Full-time" />
                      <InfoItem icon={<ShieldCheck size={16} />} label="System Role" value={employee.role ? employee.role.replace("_", " ") : "Employee"} />
                      <InfoItem icon={<UserIcon size={16} />} label="Reporting To" value="Sarah (CEO)" />
                      {employee.salary && (
                        <InfoItem icon={<TrendingUp size={16} />} label="Salary" value={`${employee.currency || "USD"} ${employee.salary.toLocaleString()}`} />
                      )}
                    </div>
                    <Divider />
                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-primary" />
                        Experience Summary
                      </h4>
                      <p className="text-sm text-default-600 leading-relaxed">
                        Currently serving as <strong>{employee.jobTitle}</strong> in the <strong>{employee.department}</strong> department.
                        Responsible for leading key initiatives and collaborating across teams to deliver high-quality business outcomes.
                        Demonstrates strong ownership and consistently delivers results under tight timelines.
                      </p>
                    </div>
                    {employee.permissions && employee.permissions.length > 0 && (
                      <>
                        <Divider />
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <ShieldCheck size={16} className="text-violet-500" />
                            Permissions
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

                <Tab key="personal" title={<span className="flex items-center gap-1.5"><UserIcon size={15} />Personal</span>}>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoItem icon={<Mail size={16} />} label="Email Address" value={employee.email} />
                      <InfoItem icon={<Phone size={16} />} label="Phone Number" value={employee.phoneNumber || "Not provided"} />
                      <InfoItem icon={<MapPin size={16} />} label="Office Location" value={employee.officeLocation || "Remote"} />
                    </div>
                  </div>
                </Tab>

                <Tab key="skills" title={<span className="flex items-center gap-1.5"><Star size={15} />Skills</span>}>
                  <div className="p-6 space-y-5">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <GraduationCap size={16} className="text-primary" />
                      Skill Proficiency
                    </h4>
                    <div className="space-y-4">
                      {SKILLS_DATA.map((skill) => (
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
                      ))}
                    </div>
                    <Divider />
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
                    </div>
                  </div>
                </Tab>

                <Tab key="assets" title={<span className="flex items-center gap-1.5"><Package size={15} />Assets</span>}>
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

                <Tab key="performance" title={<span className="flex items-center gap-1.5"><Target size={15} />Performance</span>}>
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" />
                      Appraisal History
                    </h4>
                    {employeeReviews.length === 0 ? (
                      <p className="text-sm text-default-500">No performance reviews yet.</p>
                    ) : (
                      employeeReviews.map((review) => (
                        <div key={review.id} className="p-4 bg-default-50 rounded-xl border border-default-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm">{new Date(review.date as Date | string).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={s <= Math.round(review.rating) ? "text-amber-400" : "text-default-200"}
                                  fill={s <= Math.round(review.rating) ? "currentColor" : "none"}
                                />
                              ))}
                              <span className="text-xs font-black text-amber-500 ml-1">{review.rating}</span>
                            </div>
                          </div>
                          <div className="space-y-2 mt-2">
                            <p className="text-sm font-medium">Strengths:</p>
                            <div className="flex flex-wrap gap-1">
                               {review.feedback.strengths.map(s => <Chip key={s} size="sm" variant="flat" color="success">{s}</Chip>)}
                            </div>
                            <p className="text-sm font-medium mt-2">Goals:</p>
                            <ul className="list-disc list-inside text-sm text-default-600">
                               {review.goals.map(g => <li key={g}>{g}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Tab>

                <Tab key="leaves" title={<span className="flex items-center gap-1.5"><CalendarDays size={15} />Leaves</span>}>
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
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">Employee Status</h4>
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
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">Employee ID</p>
                  <p className="font-mono text-sm font-black bg-default-50 inline-block px-2.5 py-1 rounded-lg">EMP-{employee.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">Department</p>
                  <p className="text-sm font-bold">{employee.department}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest mb-1">System Role</p>
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
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">Contact</h4>
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
              <h4 className="font-black text-[10px] text-default-400 uppercase tracking-[0.15em]">Leave Summary</h4>
              {[
                { label: "Total Requests", value: leaveStats.total, color: "text-foreground" },
                { label: "Approved", value: leaveStats.approved, color: "text-success" },
                { label: "Pending", value: leaveStats.pending, color: "text-warning" },
                { label: "Rejected", value: leaveStats.rejected, color: "text-danger" },
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
