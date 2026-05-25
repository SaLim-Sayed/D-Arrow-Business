import { Avatar } from "@heroui/react";
import type { Employee } from "../types/people.types";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgChartProps {
  employees: Employee[];
}

export function OrgChart({ employees }: OrgChartProps) {
  // Find top level managers (those who don't have a managerId or their manager isn't in the list)
  const rootEmployees = employees.filter(e => 
    !e.managerId || !employees.find(m => m.id === e.managerId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-primary" size={24} />
        <h2 className="text-xl font-bold">Organization Structure</h2>
      </div>
      
      <div className="grid gap-4">
        {rootEmployees.map(employee => (
          <OrgNode 
            key={employee.id} 
            employee={employee} 
            allEmployees={employees} 
            level={0} 
          />
        ))}
      </div>
    </div>
  );
}

function OrgNode({ employee, allEmployees, level }: { employee: Employee, allEmployees: Employee[], level: number }) {
  const directReports = allEmployees.filter(e => e.managerId === employee.id);
  const initials = `${employee.firstName?.charAt(0) || ""}${employee.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl border border-default-200 bg-white dark:bg-content1/50 transition-all hover:border-primary/50",
          level > 0 && "ml-8 relative before:absolute before:left-[-20px] before:top-1/2 before:w-5 before:h-[1px] before:bg-default-300 before:content-['']"
        )}
      >
        <Avatar
          src={employee.avatarUrl}
          fallback={initials}
          size="md"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold truncate">
            {employee.firstName} {employee.lastName}
          </h4>
          <p className="text-xs text-default-500 truncate">{employee.jobTitle}</p>
        </div>
        {directReports.length > 0 && (
          <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
            {directReports.length} reports
          </div>
        )}
      </div>

      {directReports.length > 0 && (
        <div className={cn(
          "relative",
          "before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-[1px] before:bg-default-300 before:content-['']"
        )}>
          {directReports.map(report => (
            <OrgNode 
              key={report.id} 
              employee={report} 
              allEmployees={allEmployees} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
