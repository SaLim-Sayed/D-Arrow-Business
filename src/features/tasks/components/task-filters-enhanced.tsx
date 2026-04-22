import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Select, SelectItem, Chip, Card, CardBody } from "@heroui/react";
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
      <Input
        fullWidth
        className="h-11"
        startContent={<Search className="text-default-400 h-4 w-4" />}
        placeholder={t("filters.searchPlaceholder")}
        value={filters.search || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange("search", e.target.value)}
      />

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          aria-label={t("filters.status")}
          className="w-[180px] h-11"
          selectedKeys={new Set(filters.status && filters.status.length > 0 ? [filters.status[0]] : [""])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string;
            handleFilterChange("status", val && val !== "" ? [val] : undefined);
          }}
        >
          {[
            { id: "all", text: t("filters.allStatuses") },
            ...TASK_STATUSES.map((s) => ({ id: s, text: t(`status.${s}`) }))
          ].map((opt) => (
            <SelectItem key={opt.id} textValue={opt.text}>
              {opt.text}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label={t("filters.priority")}
          className="w-[180px] h-11"
          selectedKeys={new Set(filters.priority && filters.priority.length > 0 ? [filters.priority[0]] : [""])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string;
            handleFilterChange("priority", val && val !== "" ? [val] : undefined);
          }}
        >
          {[
            { id: "all", text: t("filters.allPriorities") },
            ...TASK_PRIORITIES.map((p) => ({ id: p, text: t(`priority.${p}`) }))
          ].map((opt) => (
            <SelectItem key={opt.id} textValue={opt.text}>
              {opt.text}
            </SelectItem>
          ))}
        </Select>

        <Button
          variant="bordered"
          size="sm"
          onPress={() => setShowAdvanced(!showAdvanced)}
          className="h-11 flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("filters.advanced")}
          {activeFiltersCount > 0 && (
            <Chip size="sm" variant="flat" color="secondary">
              {activeFiltersCount}
            </Chip>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="light"
            size="sm"
            onPress={handleClearAll}
            className="text-muted-foreground h-11 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {tc("actions.clear")}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="bg-default-50 border-none shadow-none">
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Assignee Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground/80">
                  {t("filters.assignee")}
                </span>
                <Select
                  aria-label={t("filters.assignee")}
                  placeholder={t("filters.selectAssignee")}
                  className="h-11"
                  selectedKeys={new Set([filters.assigneeId || ""])}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    handleFilterChange("assigneeId", val && val !== "" ? val : undefined);
                  }}
                >
                  {[
                    { id: "all", text: t("filters.unassigned") },
                    ...availableUsers.map((u) => ({ id: u.id, text: u.name }))
                  ].map((opt) => (
                    <SelectItem key={opt.id} textValue={opt.text}>
                      {opt.text}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Sort Options */}
              {/* Note: Store doesn't seem to support sortBy/sortOrder directly in TaskFilterData but we'll keep it for UI if needed or fix it later */}
            </div>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-default-100">
                {filters.search && (
                  <Chip variant="flat" className="h-7" onClose={() => handleFilterChange("search", undefined)}>
                    {t("filters.search")}: {filters.search}
                  </Chip>
                )}
                {filters.status && filters.status[0] && (
                  <Chip variant="flat" className="h-7" onClose={() => handleFilterChange("status", undefined)}>
                    {t("filters.status")}: {t(`status.${filters.status[0]}`)}
                  </Chip>
                )}
                {filters.priority && filters.priority[0] && (
                  <Chip variant="flat" className="h-7" onClose={() => handleClearFilter("priority")}>
                    {t("filters.priority")}:{" "}
                    {t(`priority.${filters.priority[0]}`)}
                  </Chip>
                )}
                {filters.assigneeId && (
                  <Chip variant="flat" className="h-7" onClose={() => handleClearFilter("assigneeId")}>
                    {t("filters.assignee")}:{" "}
                    {availableUsers.find((u) => u.id === filters.assigneeId)
                      ?.name || "Unknown"}
                  </Chip>
                )}
              </div>
            )}
          </CardBody>
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
