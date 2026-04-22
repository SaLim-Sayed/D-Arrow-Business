import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
    getTasksByAssignee,
    getTasksByStatus,
    getTasksByPriority
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
    value => value !== undefined && value !== "" && value !== null
  ).length;

  const filteredTasks = filterTasks();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t("filters.searchPlaceholder")}
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.status?.[0] || ""}
          onValueChange={(value) => handleFilterChange("status", value ? [value] : undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("filters.allStatuses")}</SelectItem>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority?.[0] || ""}
          onValueChange={(value) => handleFilterChange("priority", value ? [value] : undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filters.priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("filters.allPriorities")}</SelectItem>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {t(`priority.${priority}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("filters.advanced")}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            {tc("actions.clear")}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Assignee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filters.assignee")}</label>
              <Select
                value={filters.assigneeId || ""}
                onValueChange={(value) => handleFilterChange("assigneeId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectAssignee")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("filters.unassigned")}</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filters.dueDate")}</label>
              <Input
                type="date"
                value={filters.dueDate || ""}
                onChange={(e) => handleFilterChange("dueDate", e.target.value || undefined)}
              />
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filters.sortBy")}</label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">{t("filters.createdAt")}</SelectItem>
                  <SelectItem value="updatedAt">{t("filters.updatedAt")}</SelectItem>
                  <SelectItem value="dueDate">{t("filters.dueDate")}</SelectItem>
                  <SelectItem value="priority">{t("filters.priority")}</SelectItem>
                  <SelectItem value="title">{t("filters.title")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filters.sortOrder")}</label>
              <Select
                value={filters?.sortOrder || "desc"}
                onValueChange={(value) => handleFilterChange("sortOrder", value as "asc" | "desc")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("filters.descending")}</SelectItem>
                  <SelectItem value="asc">{t("filters.ascending")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("filters.search")}: {filters.search}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleClearFilter("search")}
                  />
                </Badge>
              )}
              {filters.status?.[0] && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("filters.status")}: {t(`status.${filters.status[0]}`)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleClearFilter("status")}
                  />
                </Badge>
              )}
              {filters.priority?.[0] && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("filters.priority")}: {t(`priority.${filters.priority[0]}`)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleClearFilter("priority")}
                  />
                </Badge>
              )}
              {filters.assigneeId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("filters.assignee")}: {availableUsers.find(u => u.id === filters.assigneeId)?.name || "Unknown"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleClearFilter("assigneeId")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {t("filters.showingResults", { count: filteredTasks.length, total: filteredTasks.length })}
      </div>
    </div>
  );
}
