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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
          <Button asChild>
            <Link to="/tasks/new">
              <Plus className="h-4 w-4 me-1" />
              {t("list.newTask")}
            </Link>
          </Button>
        }
      />

      <TaskFilters />

      {isLoading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={tc("actions.noResults")}
          action={
            <Button asChild>
              <Link to="/tasks/new">
                <Plus className="h-4 w-4 me-1" />
                {t("list.newTask")}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">
                    {t("list.columns.title")}
                  </TableHead>
                  <TableHead>{t("list.columns.status")}</TableHead>
                  <TableHead>{t("list.columns.priority")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("list.columns.assignee")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("list.columns.dueDate")}
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
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
                    <TableRow
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <TableCell className="font-medium">
                        {task.title}
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
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t("form.assignee.unassigned")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {task.dueDate ? formatDate(task.dueDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate(`/tasks/${task.id}`);
                              }}
                            >
                              <Eye className="me-2 h-4 w-4" />
                              {tc("actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                deleteTask.mutate(task.id);
                              }}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {tc("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {tc("actions.back")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
