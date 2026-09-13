import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import { DealKanbanBoard } from "../components/DealKanbanBoard";
import { DealsListView } from "../components/DealsListView";
import { DealFormModal } from "../components/DealFormModal";
import { CrmListHeader } from "../components/CrmListHeader";
import type { CrmViewMode } from "../components/CrmViewSwitcher";

export function DealsPipelinePage() {
  const { t } = useTranslation("crm");
  const { canManageDeals } = useCrmPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("view") === "list" ? "list" : "pipeline") as CrmViewMode;
  const setViewMode = (mode: CrmViewMode) => {
    setSearchParams(mode === "pipeline" ? {} : { view: mode }, { replace: true });
  };
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0 space-y-3 animate-in fade-in duration-500 overflow-hidden">
      <div className="shrink-0">
        <CrmListHeader
          title={t("deals.title")}
          description={viewMode === "pipeline" ? t("deals.pipelineDescription") : t("deals.description")}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          actions={
            canManageDeals ? (
              <Button
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                className="rounded-full font-bold"
                onPress={() => setFormOpen(true)}
              >
                {t("deals.addDeal")}
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {viewMode === "pipeline" ? <DealKanbanBoard /> : <DealsListView />}
      </div>

      <DealFormModal isOpen={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
