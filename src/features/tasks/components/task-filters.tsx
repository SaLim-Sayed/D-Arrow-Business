import { useTranslation } from "react-i18next";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { Input, Button, Select, SelectItem } from "@heroui/react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskFilters() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { filters, setFilter, resetFilters } = useTasksUIStore();

  const hasFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.search.length > 0;

  const statusDots: Record<string, string> = {
    all: "bg-default-400",
    todo: "bg-default-400",
    in_progress: "bg-warning",
    in_review: "bg-secondary",
    done: "bg-success",
  };

  const priorityDots: Record<string, string> = {
    all: "bg-default-400",
    low: "bg-default-400",
    medium: "bg-secondary",
    high: "bg-warning",
    urgent: "bg-danger",
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Search */}
      <div className="flex-1 min-w-[280px]">
        <Input
          variant="flat"
          startContent={<Search className="h-4 w-4 text-primary" />}
          placeholder={t("list.searchPlaceholder")}
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter("search", e.target.value)
          }
          classNames={{
            inputWrapper: "glass-card border-none h-12 shadow-sm focus-within:shadow-glow transition-all duration-300",
            input: "font-bold text-sm"
          }}
          radius="lg"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Status filter */}
        <Select
          variant="flat"
          placeholder={t("list.columns.status")}
          className="w-48"
          selectedKeys={filters.status.length > 0 ? new Set([filters.status[0]]) : new Set(["all"])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setFilter("status", value === "all" ? [] : [value as any]);
          }}
          classNames={{
            trigger: "glass-card border-none h-12 shadow-sm hover:shadow-glow transition-all duration-300",
            value: "font-black text-[10px] uppercase tracking-[0.1em]"
          }}
          radius="lg"
          renderValue={(items) => {
            return items.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", statusDots[item.key as string])} />
                <span>{item.textValue}</span>
              </div>
            ));
          }}
        >
          {[
            { id: "all", text: t("list.columns.status") },
            ...TASK_STATUSES.map((s) => ({ id: s, text: t(`status.${s}`) })),
          ].map((opt) => (
            <SelectItem
              key={opt.id}
              textValue={opt.text}
              className="capitalize"
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", statusDots[opt.id])} />
                <span className="font-bold text-xs">{opt.text}</span>
              </div>
            </SelectItem>
          ))}
        </Select>

        {/* Priority filter */}
        <Select
          variant="flat"
          placeholder={t("list.columns.priority")}
          className="w-48"
          selectedKeys={filters.priority.length > 0 ? new Set([filters.priority[0]]) : new Set(["all"])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setFilter("priority", value === "all" ? [] : [value as any]);
          }}
          classNames={{
            trigger: "glass-card border-none h-12 shadow-sm hover:shadow-glow transition-all duration-300",
            value: "font-black text-[10px] uppercase tracking-[0.1em]"
          }}
          radius="lg"
          renderValue={(items) => {
            return items.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", priorityDots[item.key as string])} />
                <span>{item.textValue}</span>
              </div>
            ));
          }}
        >
          {[
            { id: "all", text: t("list.columns.priority") },
            ...TASK_PRIORITIES.map((p) => ({ id: p, text: t(`priority.${p}`) })),
          ].map((opt) => (
            <SelectItem 
              key={opt.id} 
              textValue={opt.text}
              className="capitalize"
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", priorityDots[opt.id])} />
                <span className="font-bold text-xs">{opt.text}</span>
              </div>
            </SelectItem>
          ))}
        </Select>

        {/* Reset */}
        {hasFilters && (
          <Button
            variant="flat"
            size="lg"
            onPress={resetFilters}
            className="rounded-2xl bg-danger/10 text-danger hover:bg-danger/20 font-black text-[10px] uppercase tracking-widest min-w-0 px-4 h-12 shadow-sm transition-all"
          >
            <X className="h-4 w-4 mr-1 stroke-[3px]" />
            {tc("actions.reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
