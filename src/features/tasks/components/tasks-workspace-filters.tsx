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
import { Filter, Search, UserCircle2, X, CircleDot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-wrap items-center gap-3">
      <Input
        isClearable
        size="sm"
        variant="bordered"
        placeholder={t("list.searchPlaceholder")}
        value={filters.search}
        onValueChange={(val) => setFilter("search", val)}
        startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
        className={compact ? "w-64" : "w-60"}
        classNames={{
          input: compact ? "text-xs" : "text-sm",
          inputWrapper: "rounded-lg border-default-200",
        }}
      />

      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="bordered"
            className={cn(
              "rounded-lg border-default-200 font-medium gap-2",
              compact ? "text-xs font-bold" : "text-sm",
              filters.status.length > 0 && "border-primary/40 bg-primary/5 text-primary"
            )}
            startContent={<CircleDot className="h-3.5 w-3.5" />}
          >
            {t("list.columns.status")}
            {filters.status.length > 0 && (
              <Chip size="sm" color="primary" variant="flat" className="h-4 text-[9px]">
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
              "rounded-lg border-default-200 font-medium gap-2",
              compact ? "text-xs font-bold" : "text-sm",
              filters.priority.length > 0 && "border-primary/40 bg-primary/5 text-primary"
            )}
            startContent={<Filter className="h-3.5 w-3.5" />}
          >
            {t("form.priority.label")}
            {filters.priority.length > 0 && (
              <Chip size="sm" color="primary" variant="flat" className="h-4 text-[9px]">
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
              "rounded-lg border-default-200 font-medium gap-2",
              compact ? "text-xs font-bold" : "text-sm",
              filters.assigneeId && "border-primary/40 bg-primary/5 text-primary"
            )}
            startContent={
              selectedAssignee ? (
                <Avatar
                  src={selectedAssignee.avatar}
                  name={selectedAssignee.name}
                  size="sm"
                  className={compact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]"}
                  showFallback
                />
              ) : (
                <UserCircle2 className="h-3.5 w-3.5" />
              )
            }
          >
            {selectedAssignee
              ? i18n.language === "ar"
                ? selectedAssignee.nameAr
                : selectedAssignee.name
              : t("form.assignee.label")}
            {selectedAssignee && !compact && (
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
          className={cn("font-medium", compact ? "text-xs font-bold" : "text-sm")}
          startContent={<X className="h-3.5 w-3.5" />}
        >
          {tc("actions.reset")}
        </Button>
      )}
    </div>
  );
}
