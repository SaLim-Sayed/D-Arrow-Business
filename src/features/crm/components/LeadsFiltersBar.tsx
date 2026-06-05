import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Filter, Search, X, UserCircle2, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LEAD_SOURCES, LEAD_STATUSES } from "../constants/lead-workflow";
import type { LeadsListParams } from "../utils/leads-list.utils";
import type { User } from "@/features/auth/types/auth.types";

interface LeadsFiltersBarProps {
  params: LeadsListParams;
  onChange: (patch: Partial<LeadsListParams>) => void;
  onReset: () => void;
  users?: User[];
}

export function LeadsFiltersBar({ params, onChange, onReset, users }: LeadsFiltersBarProps) {
  const { t } = useTranslation("crm");
  const selectedUser = users?.find((u) => u.id === params.assignedTo);
  const hasFilters =
    !!params.search ||
    !!params.status?.length ||
    !!params.source ||
    !!params.assignedTo ||
    !!params.dateFrom ||
    !!params.dateTo;

  return (
    <div className="flex flex-col gap-3 bg-default-50 p-4 rounded-3xl border border-default-100">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          isClearable
          size="sm"
          variant="bordered"
          placeholder={t("leads.searchPlaceholder")}
          value={params.search ?? ""}
          onValueChange={(v) => onChange({ search: v, page: 1 })}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="w-full sm:w-64"
        />

        <Dropdown closeOnSelect={false}>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="bordered"
              startContent={<Filter className="h-4 w-4" />}
              className={cn(params.status?.length && "border-primary/40 bg-primary/5")}
            >
              {t("leads.filters.status")}
              {params.status?.length ? ` (${params.status.length})` : ""}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label={t("leads.filters.status")}
            selectionMode="multiple"
            selectedKeys={new Set(params.status ?? [])}
            onSelectionChange={(keys) =>
              onChange({ status: Array.from(keys) as string[], page: 1 })
            }
          >
            {LEAD_STATUSES.map((s) => (
              <DropdownItem key={s}>{t(`leads.status.${s}`)}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Select
          size="sm"
          variant="bordered"
          placeholder={t("leads.filters.source")}
          selectedKeys={params.source ? [params.source] : []}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string | undefined;
            onChange({ source: v, page: 1 });
          }}
          className="w-40"
          aria-label={t("leads.filters.source")}
        >
          {LEAD_SOURCES.map((s) => (
            <SelectItem key={s}>{t(`leads.source.${s}`)}</SelectItem>
          ))}
        </Select>

        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="bordered"
              startContent={<UserCircle2 className="h-4 w-4" />}
              className={cn(params.assignedTo && "border-primary/40 bg-primary/5")}
            >
              {params.assignedTo === "__unassigned__"
                ? t("leads.filters.unassigned")
                : selectedUser?.name ?? t("leads.filters.assignedTo")}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label={t("leads.filters.assignedTo")}
            items={[
              { key: "all", label: t("leads.filters.allAssignees") },
              { key: "__unassigned__", label: t("leads.filters.unassigned") },
              ...(users ?? []).map((u) => ({ key: u.id, label: u.name ?? u.id })),
            ]}
            onAction={(key) =>
              onChange({ assignedTo: key === "all" ? undefined : String(key), page: 1 })
            }
          >
            {(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
          </DropdownMenu>
        </Dropdown>

        <Input
          type="date"
          size="sm"
          variant="bordered"
          label={t("leads.filters.from")}
          labelPlacement="outside-left"
          className="w-auto max-w-[11rem]"
          value={params.dateFrom ?? ""}
          onValueChange={(v) => onChange({ dateFrom: v || undefined, page: 1 })}
          startContent={<Calendar className="h-3.5 w-3.5 text-default-400 hidden sm:block" />}
        />
        <Input
          type="date"
          size="sm"
          variant="bordered"
          label={t("leads.filters.to")}
          labelPlacement="outside-left"
          className="w-auto max-w-[11rem]"
          value={params.dateTo ?? ""}
          onValueChange={(v) => onChange({ dateTo: v || undefined, page: 1 })}
        />

        {hasFilters && (
          <Button size="sm" variant="light" startContent={<X className="h-4 w-4" />} onPress={onReset}>
            {t("leads.filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
