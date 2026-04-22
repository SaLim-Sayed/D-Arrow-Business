import { useTranslation } from "react-i18next";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { 
  InputGroup,
  InputGroupPrefix,
  InputGroupInput,
  Button, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectPopover, 
  ListBox, 
  ListBoxItem 
} from "@heroui/react";
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
      <InputGroup className="flex-1 min-w-[200px] max-w-sm" variant="primary">
        <InputGroupPrefix>
          <Search className="h-4 w-4 text-default-400" />
        </InputGroupPrefix>
        <InputGroupInput
          placeholder={t("list.searchPlaceholder")}
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter("search", e.target.value)}
        />
      </InputGroup>

      {/* Status filter */}
      <Select
        aria-label={t("list.columns.status")}
        variant="primary"
        className="w-[180px]"
        selectedKey={filters.status[0] ?? "all"}
        onSelectionChange={(key) => {
          const value = key as string;
          setFilter("status", value === "all" ? [] : [value as any]);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <ListBoxItem id="all" textValue={t("list.columns.status")}>
              {t("list.columns.status")}
            </ListBoxItem>
            {TASK_STATUSES.map((s) => (
              <ListBoxItem id={s} key={s} textValue={t(`status.${s}`)}>
                {t(`status.${s}`)}
              </ListBoxItem>
            ))}
          </ListBox>
        </SelectPopover>
      </Select>

      {/* Priority filter */}
      <Select
        aria-label={t("list.columns.priority")}
        variant="primary"
        className="w-[180px]"
        selectedKey={filters.priority[0] ?? "all"}
        onSelectionChange={(key) => {
          const value = key as string;
          setFilter("priority", value === "all" ? [] : [value as any]);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <ListBoxItem id="all" textValue={t("list.columns.priority")}>
              {t("list.columns.priority")}
            </ListBoxItem>
            {TASK_PRIORITIES.map((p) => (
              <ListBoxItem id={p} key={p} textValue={t(`priority.${p}`)}>
                {t(`priority.${p}`)}
              </ListBoxItem>
            ))}
          </ListBox>
        </SelectPopover>
      </Select>

      {/* Reset */}
      {hasFilters && (
        <Button variant="tertiary" size="sm" onPress={resetFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          {tc("actions.reset")}
        </Button>
      )}
    </div>
  );
}
