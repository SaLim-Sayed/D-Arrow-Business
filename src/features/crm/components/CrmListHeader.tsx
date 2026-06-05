import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CrmViewSwitcher, type CrmViewMode } from "./CrmViewSwitcher";

interface CrmListHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  viewMode?: CrmViewMode;
  onViewModeChange?: (mode: CrmViewMode) => void;
  showViewSwitcher?: boolean;
}

export function CrmListHeader({
  title,
  description,
  actions,
  viewMode,
  onViewModeChange,
  showViewSwitcher = true,
}: CrmListHeaderProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {showViewSwitcher && viewMode && onViewModeChange && (
              <CrmViewSwitcher mode={viewMode} onChange={onViewModeChange} />
            )}
            {actions}
          </div>
        }
      />
    </div>
  );
}
