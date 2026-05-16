import React from "react";
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
 
} from "@heroui/react";
import { Edit, Eye, Trash2 } from "lucide-react";
import type { Employee } from "../types/people.types";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const renderCell = React.useCallback((employee: Employee, columnKey: React.Key) => {
    const cellValue = employee[columnKey as keyof Employee];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg", src: employee.avatarUrl }}
            description={employee.email}
            name={`${employee.firstName} ${employee.lastName}`}
          >
            {employee.email}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{employee.jobTitle}</p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {employee.department}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={
              employee.status === "active"
                ? "success"
                : employee.status === "onboarding"
                ? "primary"
                : "warning"
            }
            size="sm"
            variant="flat"
          >
            {employee.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Details">
              <span 
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => onView?.(employee)}
              >
                <Eye size={20} />
              </span>
            </Tooltip>
            <Tooltip content="Edit user">
              <span 
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => onEdit?.(employee)}
              >
                <Edit size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete user">
              <span 
                className="text-lg text-danger cursor-pointer active:opacity-50"
                onClick={() => onDelete?.(employee)}
              >
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue?.toString() || "";
    }
  }, [onView, onEdit, onDelete]);

  const columns = [
    { name: "NAME", uid: "name" },
    { name: "ROLE / DEPT", uid: "role" },
    { name: "STATUS", uid: "status" },
    { name: "JOINING DATE", uid: "joiningDate" },
    { name: "ACTIONS", uid: "actions" },
  ];

  return (
    <Table 
      aria-label="Employee directory table"
      className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100"
      removeWrapper
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            className="bg-default-50 text-default-500 font-bold text-xs py-4"
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={employees}>
        {(item) => (
          <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors">
            {(columnKey) => (
              <TableCell className="py-4">
                {columnKey === "joiningDate" 
                  ? new Date(item.joiningDate as any).toLocaleDateString()
                  : renderCell(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
