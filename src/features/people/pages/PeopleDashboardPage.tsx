
import { Button, Card, CardBody, Input, Skeleton, Tabs, Tab, Chip } from "@heroui/react";
import { 
  Plus, 
  Search, 
  Users, 
  Network, 
  CalendarDays, 
  LayoutGrid, 
  List,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCircle,
  ClipboardList,
  Palmtree,
  Megaphone,
  Target,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeCard } from "../components/EmployeeCard";
import { EmployeeTable } from "../components/EmployeeTable";
import { OrgChart } from "../components/OrgChart";
import { HireEmployeeModal } from "../components/HireEmployeeModal";
import { TerminateEmployeeModal } from "../components/TerminateEmployeeModal";
import type { TerminateAction } from "../components/TerminateEmployeeModal";
import { useEmployeesQuery, useOffboardEmployeeMutation, useAnnouncementsQuery } from "../hooks/use-people";
import type { Employee } from "../types/people.types";
import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { useAuthStore } from "@/stores/auth.store";
import { TimeTrackerWidget } from "../components/TimeTrackerWidget";
import { motion } from "framer-motion";

export default function PeopleDashboardPage() {
  
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: employeesResponse, isLoading } = useEmployeesQuery();
  const offboardMutation = useOffboardEmployeeMutation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: announcementsResponse } = useAnnouncementsQuery();
  const announcements = announcementsResponse?.data || [];

  // Offboard Modal State
  const { isOpen: isOffboardOpen, onOpen: onOffboardOpen, onOpenChange: onOffboardOpenChange } = useDisclosure();
  const [selectedEmployeeToOffboard, setSelectedEmployeeToOffboard] = useState<Employee | null>(null);

  const handleOffboardClick = (employee: Employee) => {
    setSelectedEmployeeToOffboard(employee);
    onOffboardOpen();
  };

  const handleOffboardConfirm = async ({ type, reason }: { type: TerminateAction; reason: string }) => {
    if (!selectedEmployeeToOffboard) return;
    await offboardMutation.mutateAsync({
      employeeId: selectedEmployeeToOffboard.id,
      status: type,
      reason,
    });
  };

  const isManager = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager';
  const employees = employeesResponse?.data || [];
  const filteredEmployees = employees.filter(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = employees.filter(e => e.status === 'active').length;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              People & HR
            </h1>
            <Chip size="sm" variant="flat" color="primary" className="font-bold">
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                {employees.length} Members
              </span>
            </Chip>
          </div>
          <p className="text-default-500 font-medium">
            Centrally manage your organization and people operations.
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <Button 
              color="primary" 
              variant="shadow" 
              startContent={<Plus size={18} />} 
              onPress={onOpen}
              className="font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              New Hire
            </Button>
          )}
        </div>
      </div>

      <HireEmployeeModal isOpen={isOpen} onOpenChange={onOpenChange} />
      <TerminateEmployeeModal 
        isOpen={isOffboardOpen} 
        onOpenChange={onOffboardOpenChange} 
        employee={selectedEmployeeToOffboard}
        onConfirm={handleOffboardConfirm}
      />

      {/* Attendance & Quick Actions Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimeTrackerWidget variant="full" />
        </div>
        <Card className="border border-default-100/60 shadow-lg bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
          {/* Decorative corner gradient */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-2xl" />
          <CardBody className="p-6 flex flex-col justify-center relative z-10">
            <h3 className="font-black text-lg mb-5 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <CalendarDays className="text-primary" size={20} />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button 
                  color="primary" 
                  variant="flat" 
                  className="w-full justify-start font-bold h-12 rounded-xl" 
                  onPress={() => navigate("/people/leave")}
                  startContent={
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Palmtree size={16} className="text-primary" />
                    </div>
                  }
                  endContent={<ArrowRight size={14} className="text-primary/60" />}
                >
                  Apply for Leave
                </Button>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button 
                  color="secondary" 
                  variant="flat" 
                  className="w-full justify-start font-bold h-12 rounded-xl" 
                  onPress={() => navigate("/people/approvals")}
                  startContent={
                    <div className="p-1.5 bg-secondary/10 rounded-lg">
                      <ClipboardList size={16} className="text-secondary" />
                    </div>
                  }
                  endContent={<ArrowRight size={14} className="text-secondary/60" />}
                >
                  View Approvals
                </Button>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button 
                  color="default" 
                  variant="flat" 
                  className="w-full justify-start font-bold h-12 rounded-xl" 
                  onPress={() => navigate("/profile")}
                  startContent={
                    <div className="p-1.5 bg-default-200/50 rounded-lg">
                      <UserCircle size={16} className="text-default-600" />
                    </div>
                  }
                  endContent={<ArrowRight size={14} className="text-default-400" />}
                >
                  My Profile
                </Button>
              </motion.div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Navigation Cards — unified strip */}
      <Card className="border border-default-100/60 shadow-sm overflow-x-auto">
        <CardBody className="p-0">
          <div className="flex divide-x divide-default-100 min-w-max">
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Directory" 
                desc="Full employee list" 
                icon={<Users size={20} />}
                iconBg="bg-blue-50 dark:bg-blue-500/10 text-blue-500"
                count={employees.length.toString()}
                onPress={() => {}}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Leave Tracker" 
                desc="Manage absences" 
                icon={<CalendarDays size={20} />}
                iconBg="bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                onPress={() => navigate("/people/leave")}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Approvals" 
                desc="Pending leave requests" 
                icon={<ShieldCheck size={20} />}
                iconBg="bg-rose-50 dark:bg-rose-500/10 text-rose-500"
                onPress={() => navigate("/people/approvals")}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Performance" 
                desc="Appraisals and goals" 
                icon={<Target size={20} />}
                iconBg="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                onPress={() => navigate("/people/performance")}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Timesheets" 
                desc="Company time logs" 
                icon={<FileSpreadsheet size={20} />}
                iconBg="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                onPress={() => navigate("/people/timesheets")}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <NavCard 
                title="Organization" 
                desc="Reporting structure" 
                icon={<Network size={20} />}
                iconBg="bg-violet-50 dark:bg-violet-500/10 text-violet-500"
                onPress={() => {}}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Announcements Widget */}
      {announcements.length > 0 && (
        <Card className="border border-primary/20 shadow-sm bg-gradient-to-r from-primary/5 to-violet-500/5">
          <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl text-primary shrink-0">
                <Megaphone size={24} />
              </div>
              <div>
                <h3 className="font-black text-[10px] text-primary uppercase tracking-widest mb-1">Company Announcement</h3>
                <p className="font-bold text-foreground">{announcements[0].title}</p>
                <p className="text-sm text-default-500 mt-0.5 line-clamp-1">{announcements[0].content}</p>
              </div>
            </div>
            <Button size="sm" variant="shadow" color="primary" className="font-bold shrink-0">
              View All
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs 
        aria-label="HR Operations" 
        color="primary" 
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary font-bold"
        }}
      >
        <Tab
          key="directory"
          title={
            <div className="flex items-center space-x-2">
              <Users size={18} />
              <span>Directory</span>
              <Chip size="sm" variant="flat" className="font-bold text-[10px] h-5 min-w-0 px-1.5">
                {activeCount}
              </Chip>
            </div>
          }
        >
          <div className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <Input
                isClearable
                className="w-full md:max-w-sm"
                placeholder="Search by name, role or department..."
                startContent={<Search className="text-default-300" size={18} />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                classNames={{
                  inputWrapper: "shadow-sm",
                }}
              />
              <div className="flex items-center gap-2">
                <div className="flex bg-default-100 p-1 rounded-xl mr-2">
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant={viewMode === "grid" ? "solid" : "light"}
                    color={viewMode === "grid" ? "primary" : "default"}
                    onPress={() => setViewMode("grid")}
                    className="rounded-lg shadow-none"
                  >
                    <LayoutGrid size={16} />
                  </Button>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant={viewMode === "table" ? "solid" : "light"}
                    color={viewMode === "table" ? "primary" : "default"}
                    onPress={() => setViewMode("table")}
                    className="rounded-lg shadow-none"
                  >
                    <List size={16} />
                  </Button>
                </div>
                <Button variant="flat" size="sm" className="font-bold">Filters</Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map((employee, index) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <EmployeeCard 
                          employee={employee} 
                          onClick={() => navigate(`/people/${employee.id}`)}
                          onDelete={handleOffboardClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmployeeTable 
                    employees={filteredEmployees} 
                    onView={(emp) => navigate(`/people/${emp.id}`)}
                    onDelete={handleOffboardClick}
                  />
                )}

                {filteredEmployees.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="p-4 bg-default-100 rounded-full">
                      <Users size={32} className="text-default-400" />
                    </div>
                    <p className="text-default-500 font-bold">No employees found</p>
                    <p className="text-default-400 text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Tab>
        <Tab
          key="org-chart"
          title={
            <div className="flex items-center space-x-2">
              <Network size={18} />
              <span>Org Chart</span>
            </div>
          }
        >
          <div className="pt-6 max-w-4xl mx-auto">
            <OrgChart employees={employees} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

function NavCard({ 
  title, 
  desc, 
  icon, 
  count, 
  iconBg = "bg-default-100 text-default-500",
  onPress 
}: { 
  title: string; 
  desc: string; 
  icon: any; 
  count?: string; 
  iconBg?: string;
  onPress: () => void; 
}) {
  return (
    <button 
      type="button"
      onClick={onPress}
      className="flex items-center gap-4 p-5 hover:bg-default-50 transition-colors cursor-pointer text-left w-full group"
    >
      <div className={`p-3.5 rounded-2xl ${iconBg} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
          {count && (
            <span className="bg-primary/10 text-primary text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <p className="text-default-400 text-xs font-medium mt-0.5 truncate">{desc}</p>
      </div>
      <ArrowRight size={15} className="text-default-200 group-hover:text-default-400 transition-colors shrink-0" />
    </button>
  );
}
