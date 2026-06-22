import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Plus, AlertCircle, Calendar, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useCrmTasksQuery, useCrmTaskDashboard } from "../hooks/use-crm-tasks";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { CrmTaskFormModal } from "../components/CrmTaskFormModal";
import { CRM_TASK_STATUSES, normalizeCrmTaskStatus } from "../constants/crm-task.constants";
import { selectFieldProps } from "@/components/shared/select-field";
import { formatDate } from "@/lib/utils";
import type { CrmTask, CrmTaskStatus } from "../types/crm-tasks.types";

export function CrmTasksPage() {
  const { t } = useTranslation("crm");
  const { canManageCrmTasks } = useCrmPermissions();
  const { data, isLoading } = useCrmTasksQuery();
  const { today, upcoming, overdue } = useCrmTaskDashboard();
  const { data: users } = useAllUsers();
  const [statusFilter, setStatusFilter] = useState<CrmTaskStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<CrmTask | null>(null);

  const tasks = useMemo(() => {
    const all = data?.data ?? [];
    if (statusFilter === "all") return all;
    return all.filter((task) => normalizeCrmTaskStatus(task.status) === statusFilter);
  }, [data?.data, statusFilter]);

  const assigneeName = (id: string | null) => {
    if (!id) return "—";
    return users?.find((u) => u.id === id)?.name ?? "—";
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("crmTasks.title")}
        description={t("crmTasks.description")}
        actions={
          canManageCrmTasks ? (
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              className="rounded-full font-bold"
              onPress={() => {
                setEditTask(null);
                setFormOpen(true);
              }}
            >
              {t("crmTasks.addTask")}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-warning/20 bg-warning/5">
          <CardBody className="gap-2">
            <div className="flex items-center gap-2 text-warning font-bold text-sm">
              <AlertCircle className="h-4 w-4" />
              {t("crmTasks.widgets.overdue")}
            </div>
            <p className="text-3xl font-black">{overdue.length}</p>
          </CardBody>
        </Card>
        <Card className="border border-primary/20 bg-primary/5">
          <CardBody className="gap-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Calendar className="h-4 w-4" />
              {t("crmTasks.widgets.today")}
            </div>
            <p className="text-3xl font-black">{today.length}</p>
          </CardBody>
        </Card>
        <Card className="border border-default-200 bg-default-50">
          <CardBody className="gap-2">
            <div className="flex items-center gap-2 text-default-600 font-bold text-sm">
              <Clock className="h-4 w-4" />
              {t("crmTasks.widgets.upcoming")}
            </div>
            <p className="text-3xl font-black">{upcoming.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Select
          {...selectFieldProps({ compact: true })}
          size="sm"
          variant="bordered"
          label={t("crmTasks.filters.status")}
          className="max-w-xs"
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as CrmTaskStatus | "all";
            if (v) setStatusFilter(v);
          }}
          items={[
            { id: "all", label: t("crmTasks.filters.allStatuses") },
            ...CRM_TASK_STATUSES.map((s) => ({
              id: s,
              label: t(`crmTasks.status.${s}`),
            })),
          ]}
        >
          {(item) => <SelectItem key={item.id} textValue={item.label}>{item.label}</SelectItem>}
        </Select>
      </div>

      <Card className="glass-card border-none p-2">
        <Table aria-label={t("crmTasks.title")} removeWrapper className="bg-transparent">
          <TableHeader>
            <TableColumn>{t("crmTasks.columns.title")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.type")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.status")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.priority")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.dueDate")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.assignee")}</TableColumn>
            <TableColumn>{t("crmTasks.columns.actions")}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={t("crmTasks.empty")}>
            {tasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-default-100/50">
                <TableCell>
                  <span className="font-medium">{task.title}</span>
                </TableCell>
                <TableCell>{t(`crmTasks.taskType.${task.taskType}`)}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {t(`crmTasks.status.${normalizeCrmTaskStatus(task.status)}`)}
                  </Chip>
                </TableCell>
                <TableCell>{t(`crmTasks.priority.${task.priority}`)}</TableCell>
                <TableCell>
                  <span className="text-xs text-default-500">
                    {task.dueDate ? formatDate(task.dueDate) : "—"}
                  </span>
                </TableCell>
                <TableCell>{assigneeName(task.assigneeId)}</TableCell>
                <TableCell>
                  {canManageCrmTasks && (
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="font-bold rounded-xl"
                      onPress={() => {
                        setEditTask(task);
                        setFormOpen(true);
                      }}
                    >
                      {t("crmTasks.edit")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CrmTaskFormModal
        isOpen={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTask(null);
        }}
        task={editTask}
      />
    </div>
  );
}
