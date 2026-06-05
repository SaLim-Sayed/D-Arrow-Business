import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export type CrmViewMode = "list" | "pipeline";

interface CrmViewSwitcherProps {
  mode: CrmViewMode;
  onChange: (mode: CrmViewMode) => void;
  className?: string;
}

export function CrmViewSwitcher({ mode, onChange, className }: CrmViewSwitcherProps) {
  const { t } = useTranslation("crm");

  return (
    <div className={cn("inline-flex rounded-xl border border-default-200 p-0.5 bg-default-50", className)}>
      <Button
        size="sm"
        variant={mode === "list" ? "solid" : "light"}
        color={mode === "list" ? "primary" : "default"}
        className="rounded-lg font-semibold min-w-[5rem]"
        startContent={<List className="h-3.5 w-3.5" />}
        onPress={() => onChange("list")}
      >
        {t("ui.views.list")}
      </Button>
      <Button
        size="sm"
        variant={mode === "pipeline" ? "solid" : "light"}
        color={mode === "pipeline" ? "primary" : "default"}
        className="rounded-lg font-semibold min-w-[5rem]"
        startContent={<LayoutGrid className="h-3.5 w-3.5" />}
        onPress={() => onChange("pipeline")}
      >
        {t("ui.views.pipeline")}
      </Button>
    </div>
  );
}
