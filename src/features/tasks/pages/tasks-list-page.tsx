import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useTasksQuery } from "../hooks/use-tasks";
import { useDeleteTask } from "../hooks/use-task-mutations";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { TaskFilters } from "../components/task-filters";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Button,
  Avatar,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Plus, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";

export function TasksListPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const { filters, sort, page, pageSize, setPage } = useTasksUIStore();
  const deleteTask = useDeleteTask();

  const { data, isLoading } = useTasksQuery({
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assigneeId: filters.assigneeId ?? undefined,
    search: filters.search || undefined,
    page,
    pageSize,
    sortBy: sort.field,
    sortOrder: sort.order,
  });

  const tasks = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title={t("list.title")}
        actions={
          <Link
            to="/tasks/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("list.newTask")}
          </Link>
        }
      />

      {/* <TaskFilters /> */}

      {isLoading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={tc("actions.noResults")}
          action={
            <Link
              to="/tasks/new"
              className="inline-flex items-center justify-center rounded-lg border border-default-200 bg-content2 px-4 py-2 text-sm font-medium hover:bg-content3 transition-colors gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("list.newTask")}
            </Link>
          }
        />
      ) : (
        <>
          <Table
            aria-label="Tasks table"
            selectionMode="single"
            onRowAction={(key) => navigate(`/tasks/${key}`)}
            className="bg-content1 rounded-xl"
          >
            <TableHeader>
              <TableColumn className="min-w-[250px]">
                {t("list.columns.title")}
              </TableColumn>
              <TableColumn>{t("list.columns.status")}</TableColumn>
              <TableColumn>{t("list.columns.priority")}</TableColumn>
              <TableColumn className="hidden md:table-cell">
                {t("list.columns.assignee")}
              </TableColumn>
              <TableColumn className="hidden md:table-cell">
                {t("list.columns.dueDate")}
              </TableColumn>
              <TableColumn className="w-[50px]">{""}</TableColumn>
            </TableHeader>
            <TableBody items={tasks}>
              {(task) => {
                const assigneeName =
                  i18n.language === "ar"
                    ? task.assignee?.nameAr
                    : task.assignee?.name;
                const initials = (task.assignee?.name ?? "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <span className="font-medium">{task.title}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            size="sm"
                            src={task.assignee.avatar}
                            fallback={initials}
                            showFallback
                          />
                          <span className="text-sm">{assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-default-400">
                          {t("form.assignee.unassigned")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Task actions">
                          <DropdownItem
                            key="edit"
                            onPress={() => navigate(`/tasks/${task.id}`)}
                            className="flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              {tc("actions.edit")}
                            </div>
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger flex items-center gap-2"
                            onPress={() => deleteTask.mutate(task.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              {tc("actions.delete")}
                            </div>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination total={totalPages} page={page} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
