import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  Button,
  Input,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import { Eye, Edit, Trash2, Search, Filter, Download, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";
import { selectFieldProps } from "@/components/shared/select-field";
import type { Employee } from "../types/people.types";
import { employeeDisplayName, employeeInitials } from "../utils/geo";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onHire?: () => void;
}

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Design",
  "GENERAL",
];
const STATUSES = ["active", "onboarding", "suspended", "terminated"];
const ROLES = ["super_admin", "admin", "manager", "employee"];

const statusColorMap: Record<string, "success" | "primary" | "warning" | "danger" | "default"> = {
  active: "success",
  onboarding: "primary",
  suspended: "warning",
  terminated: "danger",
};

const roleColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  super_admin: "secondary",
  admin: "primary",
  manager: "success",
  employee: "default",
};

const ROWS_PER_PAGE = 8;

export function EmployeeTable({ employees, onView, onEdit, onDelete, onHire }: EmployeeTableProps) {
  const { t, i18n } = useTranslation("people");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const fullName = employeeDisplayName(e, i18n.language).toLowerCase();
      const matchSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.jobTitle || "").toLowerCase().includes(search.toLowerCase());
      const matchDept = !departmentFilter || e.department === departmentFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      const matchRole = !roleFilter || e.role === roleFilter;
      return matchSearch && matchDept && matchStatus && matchRole;
    });
  }, [employees, search, departmentFilter, statusFilter, roleFilter, i18n.language]);

  const pages = Math.ceil(filtered.length / ROWS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const hasFilters = !!(search || departmentFilter || statusFilter || roleFilter);

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setStatusFilter("");
    setRoleFilter("");
    setPage(1);
  };

  const renderCell = React.useCallback(
    (employee: Employee, columnKey: React.Key) => {
      switch (columnKey) {
        case "name": {
          const displayName = employeeDisplayName(employee, i18n.language);
          const initials = employeeInitials(employee, i18n.language);
          return (
            <User
              avatarProps={{
                radius: "full",
                src: employee.avatarUrl,
                name: initials,
                size: "sm",
                className: "shrink-0",
              }}
              description={
                <span className="text-xs text-default-400">{employee.email}</span>
              }
              name={
                <span className="font-bold text-sm">
                  {displayName}
                </span>
              }
            />
          );
        }

        case "role":
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm">{employee.jobTitle}</span>
              <span className="text-xs text-default-400 font-medium">
                {t(
                  `departments.${employee.department}`,
                  t(
                    `departments.${(employee.department || "").toUpperCase()}`,
                    employee.department
                  )
                )}
              </span>
            </div>
          );

        case "systemRole":
          return employee.role ? (
            <Chip
              size="sm"
              variant="flat"
              color={roleColorMap[employee.role] || "default"}
              className="capitalize font-bold text-xs"
            >
              {t(`roles.${employee.role}`, employee.role.replace("_", " "))}
            </Chip>
          ) : (
            <Chip size="sm" variant="flat" color="default" className="font-bold text-xs">
              {t("roles.employee")}
            </Chip>
          );

        case "status":
          return (
            <Chip
              size="sm"
              variant="flat"
              color={statusColorMap[employee.status] || "default"}
              className="capitalize font-bold"
            >
              {t(`statuses.${employee.status}`, employee.status)}
            </Chip>
          );

        case "joiningDate":
          return (
            <span className="text-sm text-default-600 font-medium">
              {formatDate(employee.joiningDate)}
            </span>
          );

        case "actions":
          return (
            <div className="flex items-center gap-1.5 justify-center">
              <Tooltip content={t("extra.view_profile")} placement="top">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-500 hover:text-primary transition-colors"
                  onPress={() => onView?.(employee)}
                >
                  <Eye size={16} />
                </Button>
              </Tooltip>
              <Tooltip content={t("extra.edit_employee")} placement="top">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-500 hover:text-warning transition-colors"
                  onPress={() => onEdit?.(employee)}
                >
                  <Edit size={16} />
                </Button>
              </Tooltip>
              <Tooltip content={t("extra.remove_employee")} color="danger" placement="top">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-400 hover:text-danger transition-colors"
                  onPress={() => onDelete?.(employee)}
                >
                  <Trash2 size={16} />
                </Button>
              </Tooltip>
            </div>
          );

        default:
          return null;
      }
    },
    [onView, onEdit, onDelete, t, i18n.language]
  );

  const columns = [
    { name: t("timesheets.col_employee"), uid: "name" },
    { name: `${t("profile.job_title")} / ${t("profile.department")}`, uid: "role" },
    { name: t("profile.role"), uid: "systemRole" },
    { name: t("timesheets.col_status"), uid: "status" },
    { name: t("profile.joined"), uid: "joiningDate" },
    { name: t("approvals.col_actions"), uid: "actions" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <Input
          isClearable
          className="w-full md:max-w-xs"
          placeholder={t("extra.search_placeholder")}
          startContent={<Search className="text-default-400" size={16} />}
          value={search}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
          size="sm"
        />

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap">
          <Select
            {...selectFieldProps({ compact: true })}
            placeholder={t("profile.department")}
            size="sm"
            className="w-full sm:w-36"
            selectedKeys={departmentFilter ? [departmentFilter] : []}
            onSelectionChange={(keys) => {
              setDepartmentFilter(Array.from(keys as Set<string>)[0] || "");
              setPage(1);
            }}
            startContent={<Filter size={14} className="text-default-400" />}
          >
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} textValue={t(`departments.${d}`)}>{t(`departments.${d}`)}</SelectItem>
            ))}
          </Select>

          <Select
            {...selectFieldProps({ compact: true })}
            placeholder={t("timesheets.col_status")}
            size="sm"
            className="w-full sm:w-32"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => {
              setStatusFilter(Array.from(keys as Set<string>)[0] || "");
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <SelectItem key={s} textValue={t(`statuses.${s}`)} className="capitalize">{t(`statuses.${s}`)}</SelectItem>
            ))}
          </Select>

          <Select
            {...selectFieldProps({ compact: true })}
            placeholder={t("profile.role")}
            size="sm"
            className="w-full sm:w-32"
            selectedKeys={roleFilter ? [roleFilter] : []}
            onSelectionChange={(keys) => {
              setRoleFilter(Array.from(keys as Set<string>)[0] || "");
              setPage(1);
            }}
          >
            {ROLES.map((r) => (
              <SelectItem key={r} textValue={t(`roles.${r}`)} className="capitalize">{t(`roles.${r}`)}</SelectItem>
            ))}
          </Select>

          {hasFilters && (
            <Button size="sm" variant="light" color="danger" onPress={clearFilters} className="font-bold">
              {t("extra.clear_filters")}
            </Button>
          )}
        </div>

        <div className="flex gap-2 ml-auto shrink-0">
          <Tooltip content={t("common.actions.export", "Export")}>
            <Button isIconOnly size="sm" variant="flat">
              <Download size={16} />
            </Button>
          </Tooltip>
          {onHire && (
            <Button size="sm" color="primary" variant="flat" startContent={<UserPlus size={14} />} onPress={onHire} className="font-bold">
              {t("dashboard.new_hire")}
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-default-400 font-medium px-1">
        <span>
          {t("extra.showing")} <strong className="text-foreground">{paginated.length}</strong> {t("extra.of")}{" "}
          <strong className="text-foreground">{filtered.length}</strong> {t("extra.employees")}
          {hasFilters && ` ${t("extra.filtered")}`}
        </span>
        <span>{employees.length} {t("extra.total")}</span>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-default-100">
      <Table
        aria-label={t("extra.org_structure")}
        className="min-w-[760px] rounded-2xl shadow-sm"
        removeWrapper
        bottomContent={
          pages > 1 ? (
            <div className="flex justify-center py-3 border-t border-default-100">
              <Pagination
                isCompact
                showControls
                page={page}
                total={pages}
                onChange={setPage}
                color="primary"
              />
            </div>
          ) : null
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              className="bg-default-50 text-default-500 font-bold text-xs py-3"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={paginated}
          emptyContent={
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Search size={36} className="text-default-300" />
              <p className="text-default-500 font-medium">{t("extra.no_matching_employees")}</p>
              {hasFilters && (
                <Button size="sm" variant="flat" color="primary" onPress={clearFilters}>
                  {t("extra.clear_filters")}
                </Button>
              )}
            </div>
          }
        >
          {(item) => (
            <TableRow
              key={item.id}
              className="border-b border-default-50 last:border-0 hover:bg-default-50/60 transition-colors cursor-pointer"
              onClick={() => onView?.(item)}
            >
              {(columnKey) => (
                <TableCell className="py-3">{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
