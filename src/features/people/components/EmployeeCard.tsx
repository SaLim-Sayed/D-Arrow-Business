import { Avatar, Card, CardBody, Chip, Button } from "@heroui/react";
import { Mail, Phone, MapPin, Calendar, MoreVertical } from "lucide-react";
import type { Employee } from "../types/people.types";


interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase() || "E";

  const statusColors: Record<string, string> = {
    active: "success",
    onboarding: "primary",
    suspended: "warning",
    terminated: "danger",
  };

  return (
    <Card 
      isPressable 
      onClick={onClick}
      className="border border-default-200 dark:border-default-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white dark:bg-content1/50 backdrop-blur-sm"
    >
      <CardBody className="p-5">
        <div className="flex justify-between items-start mb-4">
          <Avatar
            src={employee.avatarUrl}
            fallback={initials}
            className="w-16 h-16 text-large"
            isBordered
            color={statusColors[employee.status] as any}
          />
          <div className="flex flex-col items-end gap-2">
            <Chip 
              size="sm" 
              variant="flat" 
              color={statusColors[employee.status] as any}
              className="capitalize font-semibold"
            >
              {employee.status}
            </Chip>
            <Button isIconOnly size="sm" variant="light" className="text-default-400">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-bold text-foreground">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm font-medium text-primary">
            {employee.jobTitle}
          </p>
          <p className="text-xs text-default-500 font-medium uppercase tracking-wider">
            {employee.department}
          </p>
        </div>

        <div className="space-y-2 pt-4 border-t border-default-100">
          <div className="flex items-center gap-2 text-xs text-default-600">
            <Mail size={14} className="text-default-400" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phoneNumber && (
            <div className="flex items-center gap-2 text-xs text-default-600">
              <Phone size={14} className="text-default-400" />
              <span>{employee.phoneNumber}</span>
            </div>
          )}
          {employee.officeLocation && (
            <div className="flex items-center gap-2 text-xs text-default-600">
              <MapPin size={14} className="text-default-400" />
              <span>{employee.officeLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-default-600">
            <Calendar size={14} className="text-default-400" />
            <span>Joined {new Date(employee.joiningDate as any).toLocaleDateString()}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
