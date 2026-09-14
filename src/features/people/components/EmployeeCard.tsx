import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Calendar, Mail, MapPin, MoreVertical, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Employee } from "../types/people.types";
import { employeeDisplayName, employeeInitials } from "../utils/geo";
import { formatDate } from "@/lib/utils";

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
  onDelete?: (employee: Employee) => void;
  onOffboard?: (employee: Employee) => void;
}

const statusColorMap: Record<
  string,
  "success" | "primary" | "warning" | "danger" | "default"
> = {
  active: "success",
  onboarding: "primary",
  suspended: "warning",
  terminated: "danger",
};

export function EmployeeCard({
  employee,
  onClick,
  onDelete,
  onOffboard,
}: EmployeeCardProps) {
  const { t, i18n } = useTranslation("people");
  const displayName = employeeDisplayName(employee, i18n.language);
  const initials = employeeInitials(employee, i18n.language);
  const statusColor = statusColorMap[employee.status] ?? "default";

  const departmentRaw = employee.department?.trim() || "";
  const departmentLabel = departmentRaw
    ? t(`departments.${departmentRaw}`, {
        defaultValue: t(`departments.${departmentRaw.toUpperCase()}`, {
          defaultValue: departmentRaw,
        }),
      })
    : "";

  const locationRaw = employee.officeLocation?.trim() || "";
  const locationNormalized = locationRaw.toLowerCase();
  const locationLabel = !locationRaw
    ? ""
    : locationNormalized.startsWith("remot")
      ? t("locations.remote")
      : t(`locations.${locationRaw}`, { defaultValue: locationRaw });

  return (
    <Card
      isPressable
      onPress={onClick}
      className="group h-full overflow-hidden rounded-2xl border border-default-200/80 bg-content1 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <CardBody className="gap-0 p-0">
        <div
          className={
            employee.status === "active"
              ? "h-1 bg-success"
              : employee.status === "onboarding"
                ? "h-1 bg-primary"
                : employee.status === "suspended"
                  ? "h-1 bg-warning"
                  : "h-1 bg-danger"
          }
        />

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={employee.avatarUrl}
              name={initials}
              className="h-14 w-14 shrink-0 text-sm font-bold"
              classNames={{
                base: "bg-primary/10 text-primary",
                name: "text-sm font-bold",
              }}
              isBordered
              color={statusColor}
            />

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <h3 className="truncate text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {displayName}
                  </h3>
                  {employee.jobTitle ? (
                    <p className="truncate text-sm text-default-500">
                      {employee.jobTitle}
                    </p>
                  ) : null}
                </div>

                <div
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-default-400 opacity-60 transition-opacity group-hover:opacity-100"
                        aria-label={t("extra.view_profile")}
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label={t("extra.view_profile")}>
                      <DropdownItem key="view" onPress={() => onClick?.()}>
                        {t("extra.view_profile")}
                      </DropdownItem>
                      <DropdownItem
                        key="offboard"
                        className="text-warning"
                        color="warning"
                        onPress={() => onOffboard?.(employee)}
                      >
                        {t("profile.terminate")}
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => onDelete?.(employee)}
                      >
                        {t("extra.remove_employee")}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {departmentLabel ? (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="h-5 max-w-full text-[10px] font-semibold"
                  >
                    <span className="truncate">{departmentLabel}</span>
                  </Chip>
                ) : null}
                <Chip
                  size="sm"
                  variant="flat"
                  color={statusColor}
                  className="h-5 text-[10px] font-bold capitalize"
                >
                  {t(`statuses.${employee.status}`, employee.status)}
                </Chip>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-default-100 pt-3">
            <div className="flex items-center gap-2 text-xs text-default-500">
              <Mail size={13} className="shrink-0 text-default-300" />
              <span className="truncate" dir="ltr">
                {employee.email || "—"}
              </span>
            </div>
            {employee.phoneNumber ? (
              <div className="flex items-center gap-2 text-xs text-default-500">
                <Phone size={13} className="shrink-0 text-default-300" />
                <span dir="ltr">{employee.phoneNumber}</span>
              </div>
            ) : null}
            {locationLabel ? (
              <div className="flex items-center gap-2 text-xs text-default-500">
                <MapPin size={13} className="shrink-0 text-default-300" />
                <span className="truncate">{locationLabel}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-default-500">
              <Calendar size={13} className="shrink-0 text-default-300" />
              <span>
                {t("profile.joined")} {formatDate(employee.joiningDate)}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
