import { Avatar, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { Employee } from "../types/people.types";
import { Network, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { employeeDisplayName, employeeInitials } from "../utils/geo";
import { avatarSrc } from "@/lib/image-utils";

interface OrgChartProps {
  employees: Employee[];
  onSelect?: (employee: Employee) => void;
}

export function OrgChart({ employees, onSelect }: OrgChartProps) {
  const { t } = useTranslation("people");
  const rootEmployees = employees.filter(
    (e) => !e.managerId || !employees.find((m) => m.id === e.managerId)
  );

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-default-200 py-16">
        <div className="rounded-full bg-default-100 p-4">
          <Network size={28} className="text-default-400" />
        </div>
        <p className="font-semibold text-default-600">
          {t("dashboard.no_employees")}
        </p>
        <p className="text-sm text-default-400">{t("dashboard.org_empty_hint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Users size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("extra.org_structure")}
            </h2>
            <p className="text-xs text-default-400">
              {t("dashboard.org_hint")}
            </p>
          </div>
        </div>
        <Chip size="sm" variant="flat" className="font-semibold">
          {employees.length} {t("dashboard.members")}
        </Chip>
      </div>

      <div className="space-y-3 rounded-2xl border border-default-200 bg-content1 p-4 sm:p-5">
        {rootEmployees.map((employee) => (
          <OrgNode
            key={employee.id}
            employee={employee}
            allEmployees={employees}
            level={0}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function OrgNode({
  employee,
  allEmployees,
  level,
  onSelect,
}: {
  employee: Employee;
  allEmployees: Employee[];
  level: number;
  onSelect?: (employee: Employee) => void;
}) {
  const { t, i18n } = useTranslation("people");
  const directReports = allEmployees.filter((e) => e.managerId === employee.id);
  const displayName = employeeDisplayName(employee, i18n.language);
  const initials = employeeInitials(employee, i18n.language);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect?.(employee)}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl border border-default-200 bg-default-50/60 p-3 text-start transition-colors hover:border-primary/40 hover:bg-primary/[0.04]",
          level > 0 && "ms-6 sm:ms-8"
        )}
      >
        {level > 0 && (
          <span
            aria-hidden
            className="absolute -start-4 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-default-300 sm:block"
          />
        )}
        <Avatar
          src={avatarSrc(employee.avatarUrl)}
          fallback={initials}
          size="md"
          className="shrink-0"
          isBordered
          color={employee.status === "active" ? "success" : "default"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-bold text-foreground group-hover:text-primary">
              {displayName}
            </h4>
            {employee.department && (
              <Chip size="sm" variant="flat" className="h-5 text-[10px] font-semibold">
                {t(
                  `departments.${employee.department}`,
                  t(
                    `departments.${employee.department.toUpperCase()}`,
                    employee.department
                  )
                )}
              </Chip>
            )}
          </div>
          <p className="truncate text-xs text-default-500">
            {employee.jobTitle || "—"}
          </p>
        </div>
        {directReports.length > 0 && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
            {directReports.length === 1
              ? t("extra.reports_one", { count: directReports.length })
              : t("extra.reports_other", { count: directReports.length })}
          </span>
        )}
      </button>

      {directReports.length > 0 && (
        <div
          className={cn(
            "relative space-y-2 ps-2 sm:ps-3",
            "before:absolute before:bottom-3 before:start-[11px] before:top-0 before:w-px before:bg-default-200 before:content-[''] sm:before:start-[15px]"
          )}
        >
          {directReports.map((report) => (
            <OrgNode
              key={report.id}
              employee={report}
              allEmployees={allEmployees}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
