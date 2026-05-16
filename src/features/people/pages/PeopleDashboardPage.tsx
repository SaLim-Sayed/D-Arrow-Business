
import { Button, Card, CardBody, Input, Skeleton, Tabs, Tab } from "@heroui/react";
import { 
  Plus, 
  Search, 
  Users, 
  Network, 
  CalendarDays, 
   
  LayoutGrid, 
  List,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeCard } from "../components/EmployeeCard";
import { EmployeeTable } from "../components/EmployeeTable";
import { OrgChart } from "../components/OrgChart";
import { HireEmployeeModal } from "../components/HireEmployeeModal";
import { useEmployeesQuery } from "../hooks/use-people";
import { useState } from "react";
import { useDisclosure } from "@heroui/react";

export default function PeopleDashboardPage() {
  
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: employeesResponse, isLoading } = useEmployeesQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const employees = employeesResponse?.data || [];
  const filteredEmployees = employees.filter(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            People & HR
          </h1>
          <p className="text-default-500 font-medium">
            Centrally manage your organization and people operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button color="primary" variant="shadow" startContent={<Plus size={18} />} onPress={onOpen}>
            New Hire
          </Button>
        </div>
      </div>

      <HireEmployeeModal isOpen={isOpen} onOpenChange={onOpenChange} />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavCard 
          title="Directory" 
          desc="Full employee list and contact info" 
          icon={<Users className="text-blue-500" />} 
          count={employees.length.toString()}
          onPress={() => {}}
        />
        <NavCard 
          title="Leave Tracker" 
          desc="Manage absences and vacations" 
          icon={<CalendarDays className="text-orange-500" />} 
          onPress={() => navigate("/people/leave")}
        />
        <NavCard 
          title="Approvals" 
          desc="Review pending leave requests" 
          icon={<ShieldCheck className="text-red-500" />} 
          onPress={() => navigate("/people/approvals")}
        />
        <NavCard 
          title="Organization" 
          desc="Reporting structure and org chart" 
          icon={<Network className="text-purple-500" />} 
          onPress={() => {}}
        />
      </div>

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
                <Button variant="flat" size="sm">Filters</Button>
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
                    {filteredEmployees.map(employee => (
                      <EmployeeCard 
                        key={employee.id} 
                        employee={employee} 
                        onClick={() => navigate(`/people/${employee.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmployeeTable 
                    employees={filteredEmployees} 
                    onView={(emp) => navigate(`/people/${emp.id}`)}
                  />
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

function NavCard({ title, desc, icon, count, onPress }: { title: string, desc: string, icon: any, count?: string, onPress: () => void }) {
  return (
    <Card 
      isPressable 
      onPress={onPress}
      className="border border-default-100 shadow-sm hover:border-primary/20 transition-all group"
    >
      <CardBody className="p-5 flex flex-row items-center gap-4">
        <div className="p-4 bg-default-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{title}</h3>
            {count && <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
          </div>
          <p className="text-default-500 text-xs font-medium">{desc}</p>
        </div>
        <ArrowRight size={16} className="text-default-300 group-hover:text-primary transition-colors" />
      </CardBody>
    </Card>
  );
}
