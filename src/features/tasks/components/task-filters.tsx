import { useTranslation } from "react-i18next";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { Search, X } from "lucide-react";

export function TaskFilters() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { filters, setFilter, resetFilters } = useTasksUIStore();

  const hasFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.search.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tc("actions.search")}
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status[0] ?? "all"}
        onValueChange={(value) =>
          setFilter("status", value === "all" ? [] : [value as typeof filters.status[number]])
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("list.columns.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("list.columns.status")}</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filters.priority[0] ?? "all"}
        onValueChange={(value: string) =>
          setFilter("priority", value === "all" ? [] : [value as typeof filters.priority[number]])
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("list.columns.priority")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("list.columns.priority")}</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {t(`priority.${p}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="h-4 w-4 me-1" />
          {tc("actions.reset")}
        </Button>
      )}
    </div>
  );
}
