import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputGroup,
  InputGroupPrefix,
  InputGroupInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  ListBox,
  ListBoxItem,
  Chip,
  ChipLabel,
  Card,
  CardContent,
} from "@heroui/react";
import { X, Search, Filter } from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { useTasksStore } from "@/stores/tasks.store";
import type { TaskFilters } from "../types/task.types";

export function TaskFiltersEnhanced() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();

  const {
    filters,
    setFilters,
    clearFilters,
    availableUsers,
    filterTasks,
  } = useTasksStore();

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters({ [key]: value });
  };

  const handleClearFilter = (key: keyof TaskFilters) => {
    setFilters({ [key]: undefined });
  };

  const handleClearAll = () => {
    clearFilters();
    setShowAdvanced(false);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== "" && value !== null,
  ).length;

  const filteredTasks = filterTasks();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <InputGroup fullWidth variant="primary">
        <InputGroupPrefix>
          <Search className="text-default-400 h-4 w-4" />
        </InputGroupPrefix>
        <InputGroupInput
          placeholder={t("filters.searchPlaceholder")}
          value={filters.search || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange("search", e.target.value)}
        />
      </InputGroup>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          aria-label={t("filters.status")}
          variant="primary"
          className="w-[180px]"
          selectedKey={
            filters.status && filters.status.length > 0 ? filters.status[0] : ""
          }
          onSelectionChange={(key) => {
            const val = key as string;
            handleFilterChange("status", val ? [val] : undefined);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id="" textValue={t("filters.allStatuses")}>
                {t("filters.allStatuses")}
              </ListBoxItem>
              {TASK_STATUSES.map((status) => (
                <ListBoxItem
                  id={status}
                  key={status}
                  textValue={t(`status.${status}`)}
                >
                  {t(`status.${status}`)}
                </ListBoxItem>
              ))}
            </ListBox>
          </SelectPopover>
        </Select>

        <Select
          aria-label={t("filters.priority")}
          variant="primary"
          className="w-[180px]"
          selectedKey={
            filters.priority && filters.priority.length > 0
              ? filters.priority[0]
              : ""
          }
          onSelectionChange={(key) => {
            const val = key as string;
            handleFilterChange("priority", val ? [val] : undefined);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id="" textValue={t("filters.allPriorities")}>
                {t("filters.allPriorities")}
              </ListBoxItem>
              {TASK_PRIORITIES.map((priority) => (
                <ListBoxItem
                  id={priority}
                  key={priority}
                  textValue={t(`priority.${priority}`)}
                >
                  {t(`priority.${priority}`)}
                </ListBoxItem>
              ))}
            </ListBox>
          </SelectPopover>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onPress={() => setShowAdvanced(!showAdvanced)}
          className="h-12 flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("filters.advanced")}
          {activeFiltersCount > 0 && (
            <Chip size="sm" variant="soft" color="accent">
              <ChipLabel>{activeFiltersCount}</ChipLabel>
            </Chip>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="tertiary"
            size="sm"
            onPress={handleClearAll}
            className="text-default-500 h-12 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {tc("actions.clear")}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="bg-default-50 border-none shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Assignee Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-default-700">
                  {t("filters.assignee")}
                </span>
                <Select
                  aria-label={t("filters.assignee")}
                  placeholder={t("filters.selectAssignee")}
                  variant="primary"
                  selectedKey={filters.assigneeId || ""}
                  onSelectionChange={(key) => {
                    const val = key as string;
                    handleFilterChange("assigneeId", val || undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      <ListBoxItem id="" textValue={t("filters.unassigned")}>
                        {t("filters.unassigned")}
                      </ListBoxItem>
                      {availableUsers.map((user) => (
                        <ListBoxItem
                          id={user.id}
                          key={user.id}
                          textValue={user.name}
                        >
                          {user.name}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </SelectPopover>
                </Select>
              </div>

              {/* Sort Options */}
              {/* Note: Store doesn't seem to support sortBy/sortOrder directly in TaskFilterData but we'll keep it for UI if needed or fix it later */}
            </div>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-default-100">
                {filters.search && (
                  <Chip variant="soft" className="h-7">
                    <ChipLabel>
                      {t("filters.search")}: {filters.search}
                    </ChipLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 min-w-0 p-0"
                      onPress={() => handleClearFilter("search")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Chip>
                )}
                {filters.status && filters.status[0] && (
                  <Chip variant="soft" className="h-7">
                    <ChipLabel>
                      {t("filters.status")}: {t(`status.${filters.status[0]}`)}
                    </ChipLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 min-w-0 p-0"
                      onPress={() => handleClearFilter("status")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Chip>
                )}
                {filters.priority && filters.priority[0] && (
                  <Chip variant="soft" className="h-7">
                    <ChipLabel>
                      {t("filters.priority")}:{" "}
                      {t(`priority.${filters.priority[0]}`)}
                    </ChipLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 min-w-0 p-0"
                      onPress={() => handleClearFilter("priority")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Chip>
                )}
                {filters.assigneeId && (
                  <Chip variant="soft" className="h-7">
                    <ChipLabel>
                      {t("filters.assignee")}:{" "}
                      {availableUsers.find((u) => u.id === filters.assigneeId)
                        ?.name || "Unknown"}
                    </ChipLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 min-w-0 p-0"
                      onPress={() => handleClearFilter("assigneeId")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Chip>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {t("filters.showingResults", {
          count: filteredTasks.length,
          total: filteredTasks.length,
        })}
      </div>
    </div>
  );
}
