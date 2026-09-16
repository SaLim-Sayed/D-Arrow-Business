import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";
import { Filter, Search, UserCircle2, X, CircleDot, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { localizedName } from "@/lib/localized-name";
import { TASK_STATUSES } from "@/lib/constants";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useTasksUIStore } from "../store/tasks-ui.store";
import type { TaskPriority, TaskStatus } from "../types/task.types";

interface TasksWorkspaceFiltersProps {
  compact?: boolean;
}

export function TasksWorkspaceFilters({ compact }: TasksWorkspaceFiltersProps) {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { filters, setFilter, resetFilters } = useTasksUIStore();
  const { data: allUsers } = useAllUsers();

  const priorities = ["low", "medium", "high", "urgent"] as const;
  const selectedAssignee = allUsers?.find((u) => u.id === filters.assigneeId) ?? null;
  const hasActiveFilters =
    !!filters.search ||
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    !!filters.assigneeId ||
    !!filters.sprintId ||
    filters.overdueOnly ||
    filters.completedThisWeek;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        isClearable
        size="sm"
        variant="bordered"
        placeholder={t("list.searchPlaceholder")}
        value={filters.search}
        onValueChange={(val) => setFilter("search", val)}
        startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
        className={compact ? "w-56" : "w-60"}
        classNames={{
          input: compact ? "text-xs" : "text-xs font-medium",
          inputWrapper: "rounded-xl border-default-200/80 bg-content1 shadow-xs h-9 min-h-9",
        }}
      />

      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="bordered"
            className={cn(
              "rounded-xl border-default-200/80 bg-content1 font-semibold gap-1.5 h-9 min-h-9",
              compact ? "text-xs" : "text-xs",
              filters.status.length > 0 && "border-primary/40 bg-primary/10 text-primary"
            )}
            startContent={<CircleDot className="h-3.5 w-3.5" />}
          >
            {t("list.columns.status")}
            {filters.status.length > 0 && (
              <Chip size="sm" color="primary" variant="flat" className="h-4 text-[9px] font-bold px-1 min-w-4">
                {filters.status.length}
              </Chip>
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Filter status"
          selectionMode="multiple"
          selectedKeys={new Set(filters.status)}
          onSelectionChange={(keys) => {
            setFilter("status", Array.from(keys) as TaskStatus[]);
            setFilter("overdueOnly", false);
            setFilter("completedThisWeek", false);
          }}
        >
          {TASK_STATUSES.map((status) => (
            <DropdownItem key={status}>
              {t(`status.${status}`)}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="bordered"
            className={cn(
              "rounded-xl border-default-200/80 bg-content1 font-semibold gap-1.5 h-9 min-h-9",
              compact ? "text-xs" : "text-xs",
              filters.priority.length > 0 && "border-primary/40 bg-primary/10 text-primary"
            )}
            startContent={<Filter className="h-3.5 w-3.5" />}
          >
            {t("form.priority.label")}
            {filters.priority.length > 0 && (
              <Chip size="sm" color="primary" variant="flat" className="h-4 text-[9px] font-bold px-1 min-w-4">
                {filters.priority.length}
              </Chip>
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Filter priority"
          selectionMode="multiple"
          selectedKeys={new Set(filters.priority)}
          onSelectionChange={(keys) =>
            setFilter("priority", Array.from(keys) as TaskPriority[])
          }
        >
          {priorities.map((p) => (
            <DropdownItem key={p} className="capitalize">
              {t(`priority.${p}`)}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="bordered"
            className={cn(
              "rounded-xl border-default-200/80 bg-content1 font-semibold gap-1.5 h-9 min-h-9",
              compact ? "text-xs" : "text-xs",
              filters.assigneeId && "border-primary/40 bg-primary/10 text-primary"
            )}
            startContent={
              selectedAssignee ? (
                <Avatar
                  src={selectedAssignee.avatar}
                  name={selectedAssignee.name}
                  size="sm"
                  className={compact ? "h-4 w-4 text-[8px]" : "h-4.5 w-4.5 text-[9px]"}
                  showFallback
                />
              ) : (
                <UserCircle2 className="h-3.5 w-3.5" />
              )
            }
          >
            {selectedAssignee
              ? localizedName(i18n.language, {
                  name: selectedAssignee.name,
                  nameAr: selectedAssignee.nameAr,
                })
              : t("form.assignee.label")}
            {selectedAssignee && (
              <span
                role="button"
                className="ms-1 hover:text-danger p-0.5"
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
                  className="h-5 w-5 text-[9px]"
                  showFallback
                />
              }
            >
              {localizedName(i18n.language, { name: u.name, nameAr: u.nameAr })}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      {/* Quick Filter Pill: Overdue */}
      <Button
        size="sm"
        variant="bordered"
        onPress={() => setFilter("overdueOnly", !filters.overdueOnly)}
        className={cn(
          "rounded-xl font-bold gap-1 h-9 min-h-9 text-xs transition-colors",
          filters.overdueOnly
            ? "border-danger/40 bg-danger/10 text-danger"
            : "border-default-200/80 bg-content1 text-default-600 hover:text-danger"
        )}
        startContent={<AlertTriangle className="h-3.5 w-3.5" />}
      >
        {t("dashboard.overdue")}
      </Button>

      {/* Quick Filter Pill: Completed This Week */}
      <Button
        size="sm"
        variant="bordered"
        onPress={() => setFilter("completedThisWeek", !filters.completedThisWeek)}
        className={cn(
          "rounded-xl font-bold gap-1 h-9 min-h-9 text-xs transition-colors",
          filters.completedThisWeek
            ? "border-success/40 bg-success/10 text-success"
            : "border-default-200/80 bg-content1 text-default-600 hover:text-success"
        )}
        startContent={<CheckCircle2 className="h-3.5 w-3.5" />}
      >
        {t("dashboard.completedThisWeek")}
      </Button>

      {hasActiveFilters && (
        <Button
          size="sm"
          variant="light"
          color="danger"
          onPress={resetFilters}
          className="font-bold text-xs h-9 min-h-9 rounded-xl"
          startContent={<X className="h-3.5 w-3.5" />}
        >
          {tc("actions.reset")}
        </Button>
      )}
    </div>
  );
}

