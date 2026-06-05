import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLeadsQuery } from "../hooks/use-leads";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Pagination } from "@/components/shared/pagination";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User as UserAvatar,
  Button,
  Card,
} from "@heroui/react";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { applyLeadsListPipeline, type LeadsListParams } from "../utils/leads-list.utils";
import type { LeadSortField } from "../constants/lead-workflow";
import { LeadsFiltersBar } from "../components/LeadsFiltersBar";
import { LeadFormModal } from "../components/LeadFormModal";
import { LeadStatusChip } from "../components/LeadStatusChip";
import { LeadKanbanBoard } from "../components/LeadKanbanBoard";
import { CrmListHeader } from "../components/CrmListHeader";
import type { CrmViewMode } from "../components/CrmViewSwitcher";
import { formatDate } from "@/lib/utils";

const DEFAULT_PARAMS: LeadsListParams = {
  page: 1,
  pageSize: 10,
  sortField: "createdAt",
  sortOrder: "desc",
};

export function LeadsListPage() {
  const { t } = useTranslation("crm");
  const { canManageLeads } = useCrmPermissions();
  const { data, isLoading } = useLeadsQuery();
  const { data: users } = useAllUsers();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("view") === "list" ? "list" : "pipeline") as CrmViewMode;
  const setViewMode = (mode: CrmViewMode) => {
    setSearchParams(mode === "pipeline" ? {} : { view: mode }, { replace: true });
  };
  const [params, setParams] = useState<LeadsListParams>(DEFAULT_PARAMS);
  const [formOpen, setFormOpen] = useState(false);

  const pipeline = useMemo(() => {
    const all = data?.data ?? [];
    return applyLeadsListPipeline(all, params);
  }, [data?.data, params]);

  const assigneeName = (id: string | null) => {
    if (!id) return "—";
    return users?.find((u) => u.id === id)?.name ?? "—";
  };

  const toggleSort = (field: LeadSortField) => {
    setParams((p) => ({
      ...p,
      sortField: field,
      sortOrder: p.sortField === field && p.sortOrder === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const SortIcon = ({ field }: { field: LeadSortField }) => {
    if (params.sortField !== field) return null;
    return params.sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ms-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ms-1" />
    );
  };

  if (isLoading) return <LoadingSpinner />;

  if (viewMode === "pipeline") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <CrmListHeader
          title={t("leads.title")}
          description={t("leads.pipelineDescription")}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          actions={
            canManageLeads ? (
              <Button
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                className="rounded-full font-bold"
                onPress={() => setFormOpen(true)}
              >
                {t("leads.addLead")}
              </Button>
            ) : undefined
          }
        />
        <LeadKanbanBoard />
        <LeadFormModal isOpen={formOpen} onOpenChange={setFormOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CrmListHeader
        title={t("leads.title")}
        description={t("leads.description")}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        actions={
          canManageLeads ? (
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              className="rounded-full font-bold"
              onPress={() => setFormOpen(true)}
            >
              {t("leads.addLead")}
            </Button>
          ) : undefined
        }
      />

      <LeadsFiltersBar
        params={params}
        users={users}
        onChange={(patch) => setParams((p) => ({ ...p, ...patch }))}
        onReset={() => setParams(DEFAULT_PARAMS)}
      />

      <Card className="glass-card border-none p-2">
        <Table aria-label={t("leads.title")} removeWrapper className="bg-transparent">
          <TableHeader>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("name")}>
                {t("leads.columns.name")}
                <SortIcon field="name" />
              </button>
            </TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("company")}>
                {t("leads.columns.company")}
                <SortIcon field="company" />
              </button>
            </TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("status")}>
                {t("leads.columns.status")}
                <SortIcon field="status" />
              </button>
            </TableColumn>
            <TableColumn>{t("leads.columns.assigned")}</TableColumn>
            <TableColumn>{t("leads.columns.phone")}</TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("createdAt")}>
                {t("leads.columns.created")}
                <SortIcon field="createdAt" />
              </button>
            </TableColumn>
            <TableColumn>{t("leads.columns.actions")}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={t("leads.empty")}>
            {pipeline.items.map((lead) => (
              <TableRow
                key={lead.id}
                className="hover:bg-default-100/50 transition-colors cursor-pointer group"
              >
                <TableCell>
                  <UserAvatar
                    name={lead.name}
                    description={lead.email}
                    avatarProps={{
                      src: lead.email ? `https://avatar.vercel.sh/${lead.email}` : undefined,
                      size: "sm",
                    }}
                    className="font-bold"
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium text-default-600">{lead.company || "—"}</span>
                </TableCell>
                <TableCell>
                  <LeadStatusChip status={lead.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-600">{assigneeName(lead.assignedTo)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-default-500 font-mono text-xs">{lead.phone || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-default-500 text-xs">{formatDate(lead.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <Button
                    as={Link}
                    to={`/crm/leads/${lead.id}`}
                    size="sm"
                    variant="light"
                    color="primary"
                    className="font-bold rounded-xl"
                  >
                    {t("leads.details")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-center">
        <Pagination
          total={pipeline.totalPages}
          page={pipeline.page}
          onChange={(page) => setParams((p) => ({ ...p, page }))}
        />
      </div>

      <LeadFormModal isOpen={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
