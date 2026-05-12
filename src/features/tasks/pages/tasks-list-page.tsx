import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatDate } from "@/lib/utils";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Eye, MoreHorizontal, Plus, Search, Trash2, UserCircle2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteTask } from "../hooks/use-task-mutations";
import { useTasksQuery } from "../hooks/use-tasks";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import type { Task } from "../types/task.types";


export function TasksListPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const { filters, sort, page, pageSize, setPage, setFilter, resetFilters } = useTasksUIStore();
  const { data: allUsers } = useAllUsers();

  const { data, isLoading: isTasksLoading } = useTasksQuery({
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assigneeId: filters.assigneeId ?? undefined,
    sprintId: filters.sprintId ?? undefined,
    search: filters.search || undefined,
    page,
    pageSize,
    sortBy: sort.field,
    sortOrder: sort.order,
  });

  const deleteTask = useDeleteTask();

  const isLoading = isTasksLoading || !allUsers;

  const tasks = (data?.data ?? []).map((task: Task) => ({
    ...task,
    assignee: allUsers?.find(u => u.id === task.assigneeId) || null
  }));
  const totalPages = data?.totalPages ?? 1;

  const selectedAssignee = allUsers?.find((u) => u.id === filters.assigneeId) ?? null;
  const hasActiveFilters = !!filters.search || filters.priority.length > 0 || !!filters.assigneeId || !!filters.sprintId;

  return (
    <div>
      <PageHeader
        title={t("list.title")}
        actions={
          <Link
            to="/tasks/new"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors gap-2 shadow-xl shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            {t("list.newTask")}
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <Input
          isClearable
          size="sm"
          variant="bordered"
          placeholder={t("list.searchPlaceholder")}
          value={filters.search}
          onValueChange={(val) => setFilter("search", val)}
          startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
          className="w-60"
          classNames={{
            input: "text-sm",
            inputWrapper: "rounded-lg border-default-200",
          }}
        />

        {/* Assignee filter */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="bordered"
              className={cn(
                "rounded-lg border-default-200 font-medium text-sm gap-2",
                filters.assigneeId && "border-primary/40 bg-primary/5 text-primary",
              )}
              startContent={
                selectedAssignee ? (
                  <Avatar
                    src={selectedAssignee.avatar}
                    name={selectedAssignee.name}
                    size="sm"
                    className="h-5 w-5 text-[9px]"
                    showFallback
                  />
                ) : (
                  <UserCircle2 className="h-4 w-4" />
                )
              }
            >
              {selectedAssignee
                ? (i18n.language === "ar" ? selectedAssignee.nameAr : selectedAssignee.name)
                : t("form.assignee.label")}
              {selectedAssignee && (
                <span
                  role="button"
                  className="ml-1 hover:text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilter("assigneeId", null);
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Filter by assignee"
            selectionMode="single"
            selectedKeys={filters.assigneeId ? new Set([filters.assigneeId]) : new Set()}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string | undefined;
              setFilter("assigneeId", selected ?? null);
            }}
          >
            {(allUsers ?? []).map((u) => (
              <DropdownItem
                key={u.id}
                startContent={
                  <Avatar
                    src={u.avatar}
                    name={u.name}
                    size="sm"
                    className="h-6 w-6 text-[10px]"
                    showFallback
                  />
                }
              >
                {i18n.language === "ar" ? u.nameAr : u.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {hasActiveFilters && (
          <Button
            size="sm"
            variant="light"
            color="danger"
            onPress={resetFilters}
            className="font-medium text-sm"
            startContent={<X className="h-3.5 w-3.5" />}
          >
            {tc("actions.reset")}
          </Button>
        )}
      </div>

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
              {(task: Task) => {
                const assigneeName =
                  i18n.language === "ar"
                    ? task.assignee?.nameAr
                    : task.assignee?.name;
                const initials = (task.assignee?.name ?? "")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {task.parentId && (
                          <span className="text-[10px] font-medium text-primary cursor-pointer hover:underline" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tasks/${task.parentId}`);
                          }}>
                            ↑ TASK-{task.parentId.slice(-4).toUpperCase()}
                          </span>
                        )}
                        <span className="font-medium">{task.title}</span>
                      </div>
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
