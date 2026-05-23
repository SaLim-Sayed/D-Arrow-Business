import { Avatar, Card, CardBody, Chip, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Mail, Phone, MapPin, Calendar, MoreVertical } from "lucide-react";
import type { Employee } from "../types/people.types";

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
  onDelete?: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onClick, onDelete }: EmployeeCardProps) {
  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase() || "E";

  const statusColors: Record<string, string> = {
    active: "success",
    onboarding: "primary",
    suspended: "warning",
    terminated: "danger",
  };

  const statusGlow: Record<string, string> = {
    active: "ring-success/30",
    onboarding: "ring-primary/30",
    suspended: "ring-warning/30",
    terminated: "ring-danger/30",
  };

  return (
    <Card 
      isPressable 
      onClick={onClick}
      className="border border-default-100/60 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl bg-white/80 dark:bg-content1/50 backdrop-blur-sm group overflow-hidden"
    >
      <CardBody className="p-0">
        {/* Top gradient accent */}
        <div className={`h-1 bg-gradient-to-r ${
          employee.status === 'active' ? 'from-success/40 to-success/10' :
          employee.status === 'onboarding' ? 'from-primary/40 to-primary/10' :
          employee.status === 'suspended' ? 'from-warning/40 to-warning/10' :
          'from-danger/40 to-danger/10'
        }`} />
        
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className={`ring-2 ${statusGlow[employee.status] || 'ring-default-200'} rounded-full p-0.5`}>
              <Avatar
                src={employee.avatarUrl}
                fallback={initials}
                className="w-14 h-14 text-large"
                isBordered
                color={statusColors[employee.status] as any}
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Chip 
                size="sm" 
                variant="flat" 
                color={statusColors[employee.status] as any}
                className="capitalize font-bold text-[10px]"
              >
                {employee.status}
              </Chip>
              <div onClick={(e) => e.stopPropagation()}>
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    className="text-default-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Employee Actions" disabledKeys={['view']}>
                  <DropdownItem key="view" onPress={() => onClick?.()}>
                    View Profile
                  </DropdownItem>
                  <DropdownItem 
                    key="offboard" 
                    className="text-danger" 
                    color="danger"
                    onPress={() => onDelete?.(employee)}
                  >
                    Offboard / Resign
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <h3 className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm font-bold text-primary/80">
              {employee.jobTitle}
            </p>
            <p className="text-[11px] text-default-400 font-bold uppercase tracking-widest">
              {employee.department}
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-default-100/60">
            <div className="flex items-center gap-2 text-xs text-default-500">
              <Mail size={13} className="text-default-300 shrink-0" />
              <span className="truncate font-medium">{employee.email}</span>
            </div>
            {employee.phoneNumber && (
              <div className="flex items-center gap-2 text-xs text-default-500">
                <Phone size={13} className="text-default-300 shrink-0" />
                <span className="font-medium">{employee.phoneNumber}</span>
              </div>
            )}
            {employee.officeLocation && (
              <div className="flex items-center gap-2 text-xs text-default-500">
                <MapPin size={13} className="text-default-300 shrink-0" />
                <span className="font-medium">{employee.officeLocation}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-default-500">
              <Calendar size={13} className="text-default-300 shrink-0" />
              <span className="font-medium">Joined {new Date(employee.joiningDate as any).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
