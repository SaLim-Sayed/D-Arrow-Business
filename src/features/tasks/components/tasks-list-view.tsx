import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Pagination } from "@/components/shared/pagination";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { initialsFromName, localizedName } from "@/lib/localized-name";
import { avatarSrc } from "@/lib/image-utils";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteTask, useUpdateTask } from "../hooks/use-task-mutations";
import { useTasksQuery } from "../hooks/use-tasks";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import type { Task, TaskPriority, TaskStatus } from "../types/task.types";

export function TasksListView() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const { filters, sort, page, pageSize, setPage } = useTasksUIStore();
  const { data: allUsers } = useAllUsers();

  const { data, isLoading: isTasksLoading } = useTasksQuery({
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assigneeId: filters.assigneeId ?? undefined,
    sprintId: filters.sprintId ?? undefined,
    search: filters.search || undefined,
    overdueOnly: filters.overdueOnly || undefined,
    completedThisWeek: filters.completedThisWeek || undefined,
    page,
    pageSize,
    sortBy: sort.field,
    sortOrder: sort.order,
  });

  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const isLoading = isTasksLoading || !allUsers;

  const tasks = (data?.data ?? []).map((task: Task) => ({
    ...task,
    assignee: allUsers?.find((u) => u.id === task.assigneeId) || null,
  }));
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={tc("actions.noResults")}
        action={
          <Link
            to="/tasks/new"
            className="inline-flex items-center justify-center rounded-xl border border-default-200 bg-content2 px-4 py-2 text-sm font-semibold hover:bg-content3 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("list.newTask")}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-2xl border border-default-200/80 bg-content1">
      <Table
        aria-label="Tasks table"
        selectionMode="single"
        onRowAction={(key) => navigate(`/tasks/${key}`)}
        className="min-w-[640px] rounded-2xl bg-content1 shadow-sm"
      >
        <TableHeader>
          <TableColumn className="min-w-[250px]">{t("list.columns.title")}</TableColumn>
          <TableColumn>{t("list.columns.status")}</TableColumn>
          <TableColumn>{t("list.columns.priority")}</TableColumn>
          <TableColumn className="hidden md:table-cell">{t("list.columns.assignee")}</TableColumn>
          <TableColumn className="hidden md:table-cell">{t("list.columns.dueDate")}</TableColumn>
          <TableColumn className="w-[50px]">{""}</TableColumn>
        </TableHeader>
        <TableBody items={tasks}>
          {(task: Task) => {
            const assigneeName = localizedName(i18n.language, {
              name: task.assignee?.name,
              nameAr: task.assignee?.nameAr,
            });
            const initials = initialsFromName(
              assigneeName || task.assignee?.email || "",
              "?"
            );

            return (
              <TableRow key={task.id} className="hover:bg-default-100/50 transition-colors">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {task.parentId && (
                      <span
                        className="text-[10px] font-bold text-primary cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tasks/${task.parentId}`);
                        }}
                      >
                        ↑ TSK-{task.parentId.slice(-4).toUpperCase()}
                      </span>
                    )}
                    <span className="font-bold text-foreground text-sm">{task.title}</span>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Dropdown>
                    <DropdownTrigger>
                      <button type="button" className="cursor-pointer hover:opacity-80 transition-opacity">
                        <StatusBadge status={task.status} />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change status"
                      selectionMode="single"
                      selectedKeys={new Set([task.status])}
                      onSelectionChange={(keys) => {
                        const newStatus = Array.from(keys)[0] as TaskStatus;
                        if (newStatus && newStatus !== task.status) {
                          updateTask.mutate({ id: task.id, data: { status: newStatus } });
                        }
                      }}
                    >
                      {TASK_STATUSES.map((st) => (
                        <DropdownItem key={st}>
                          {t(`status.${st}`)}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Dropdown>
                    <DropdownTrigger>
                      <button type="button" className="cursor-pointer hover:opacity-80 transition-opacity">
                        <PriorityBadge priority={task.priority} />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change priority"
                      selectionMode="single"
                      selectedKeys={new Set([task.priority])}
                      onSelectionChange={(keys) => {
                        const newPriority = Array.from(keys)[0] as TaskPriority;
                        if (newPriority && newPriority !== task.priority) {
                          updateTask.mutate({ id: task.id, data: { priority: newPriority } });
                        }
                      }}
                    >
                      {TASK_PRIORITIES.map((pr) => (
                        <DropdownItem key={pr} className="capitalize">
                          {t(`priority.${pr}`)}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={avatarSrc(task.assignee.avatar)}
                        fallback={initials}
                        showFallback
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="text-xs font-semibold">{assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-default-400">{t("form.assignee.unassigned")}</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs font-semibold text-default-500">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly variant="light" size="sm" className="rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Task actions">
                      <DropdownItem
                        key="edit"
                        onPress={() => navigate(`/tasks/${task.id}`)}
                        startContent={<Eye className="h-4 w-4 text-default-500" />}
                      >
                        {tc("actions.edit")}
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => deleteTask.mutate(task.id)}
                        startContent={<Trash2 className="h-4 w-4 text-danger" />}
                      >
                        {tc("actions.delete")}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}
    </>
  );
}
