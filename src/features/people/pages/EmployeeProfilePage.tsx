import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { 
  Button, 
  Card, 
  CardBody, 
  Avatar, 
  Chip, 
  Tabs, 
  Tab,
  Divider,
  useDisclosure
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
  Clock
} from "lucide-react";
import { useEmployeesQuery } from "../hooks/use-people";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: employeesResponse } = useEmployeesQuery();
  
  const employee = employeesResponse?.data?.find(e => e.id === id);
  const isOwnProfile = user?.id === employee?.userId;

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-default-500 font-medium">Employee not found</p>
        <Button variant="flat" onPress={() => navigate("/people")}>Go Back</Button>
      </div>
    );
  }

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button 
        variant="light" 
        startContent={<ChevronLeft size={18} />} 
        onPress={() => navigate("/people")}
        className="font-bold text-default-500"
      >
        Back to Directory
      </Button>

      {/* Profile Header */}
      <Card className="border border-default-100 shadow-sm overflow-visible">
        <CardBody className="p-0">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-t-2xl" />
          <div className="px-8 pb-8">
            <div className="relative -mt-12 flex flex-col md:flex-row items-end gap-6 mb-6">
              <Avatar
                src={employee.avatarUrl}
                fallback={initials}
                className="w-32 h-32 text-4xl border-4 border-background shadow-xl"
              />
              <div className="flex-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black">{employee.firstName} {employee.lastName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold">{employee.jobTitle}</span>
                      <span className="text-default-300">•</span>
                      <span className="text-default-500 font-medium">{employee.department}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isOwnProfile && (
                      <Button 
                        color="primary" 
                        variant="shadow" 
                        startContent={<Clock size={18} />}
                        onPress={onOpen}
                      >
                        Apply Leave
                      </Button>
                    )}
                    <Button color="primary" variant="flat">Edit Profile</Button>
                  </div>
                </div>
              </div>
            </div>

            <ApplyLeaveModal isOpen={isOpen} onOpenChange={onOpenChange} />


            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="md:col-span-2">
                <Tabs 
                  aria-label="Profile tabs" 
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6",
                    tabContent: "font-bold"
                  }}
                >
                  <Tab
                    key="work"
                    title={
                      <div className="flex items-center gap-2">
                        <Briefcase size={18} />
                        <span>Work</span>
                      </div>
                    }
                  >
                    <div className="py-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoItem icon={<Calendar size={18} />} label="Joining Date" value={new Date(employee.joiningDate as any).toLocaleDateString()} />
                        <InfoItem icon={<Briefcase size={18} />} label="Employment Type" value="Full-time" />
                        <InfoItem icon={<ShieldCheck size={18} />} label="Role" value={employee.jobTitle} />
                        <InfoItem icon={<UserIcon size={18} />} label="Reporting To" value="John Doe (CEO)" />
                      </div>
                      <Divider />
                      <div className="space-y-4">
                        <h4 className="font-bold flex items-center gap-2">
                          <FileText size={18} className="text-primary" />
                          Experience Summary
                        </h4>
                        <p className="text-sm text-default-600 leading-relaxed">
                          Currently serving as {employee.jobTitle} in the {employee.department} department. 
                          Responsible for leading key initiatives and collaborating across teams to deliver high-quality business outcomes.
                        </p>
                      </div>
                    </div>
                  </Tab>
                  <Tab
                    key="personal"
                    title={
                      <div className="flex items-center gap-2">
                        <UserIcon size={18} />
                        <span>Personal</span>
                      </div>
                    }
                  >
                    <div className="py-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoItem icon={<Mail size={18} />} label="Email Address" value={employee.email} />
                        <InfoItem icon={<Phone size={18} />} label="Phone Number" value={employee.phoneNumber || "Not provided"} />
                        <InfoItem icon={<MapPin size={18} />} label="Office Location" value={employee.officeLocation || "Remote"} />
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="bg-default-50/50 border-none shadow-none p-2">
                  <CardBody className="space-y-4">
                    <h4 className="font-bold text-sm text-default-400 uppercase tracking-wider">Status</h4>
                    <Chip 
                      color={employee.status === 'active' ? 'success' : 'warning'} 
                      variant="flat" 
                      className="capitalize font-bold"
                    >
                      {employee.status}
                    </Chip>
                    <Divider />
                    <h4 className="font-bold text-sm text-default-400 uppercase tracking-wider">Employee ID</h4>
                    <p className="font-mono text-sm font-bold">EMP-{employee.id.toUpperCase()}</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-default-100 rounded-lg text-default-500">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-default-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-default-700">{value}</p>
      </div>
    </div>
  );
}
