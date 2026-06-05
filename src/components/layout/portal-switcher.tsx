import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";
import { getPortalFromPath, type PortalId } from "@/lib/portal-permissions";
import { PORTAL_META } from "@/features/portals/constants/portal-meta";
import { PortalPickerDrawer } from "@/features/portals/components/PortalPickerDrawer";
import { useLayoutStore } from "@/stores/layout.store";

export function PortalFloatingButton() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const current = getPortalFromPath(location.pathname);
  const { portalPickerOpen, setPortalPickerOpen } = useLayoutStore();
  const [localOpen, setLocalOpen] = useState(false);
  const isRtl = i18n.language === "ar";

  const drawerOpen = portalPickerOpen || localOpen;
  const setDrawerOpen = (open: boolean) => {
    setLocalOpen(open);
    setPortalPickerOpen(open);
  };

  if (portals.length <= 1) return null;

  const activePortal: PortalId | null =
    current === "tasks" || current === "crm" || current === "people"
      ? current
      : null;

  const activeMeta = activePortal ? PORTAL_META[activePortal] : null;
  const ActiveIcon = activeMeta?.icon ?? LayoutGrid;
  const label = activeMeta ? t(activeMeta.shortKey) : t("portals.allApps");

  const openDrawer = () => setDrawerOpen(true);

  return (
    <>
      <div
        className={cn(
          "fixed z-[200] flex flex-col items-center gap-1",
          "bottom-[max(1rem,env(safe-area-inset-bottom))]",
          isRtl ? "left-4" : "right-4",
          "md:bottom-6",
          isRtl ? "md:left-6" : "md:right-6"
        )}
      >
        {/* Mobile: compact FAB with brand logo */}
        <Button
          isIconOnly
          color="primary"
          onPress={openDrawer}
          aria-label={t("portals.switchPortal")}
          className={cn(
            "md:hidden h-14 w-14 rounded-full shadow-2xl shadow-primary/40",
            "ring-4 ring-background/80 backdrop-blur-sm",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-default-100">
            <Logo size="sm" variant="icon" className="h-7 w-7 [&_img]:h-7" />
          </span>
        </Button>

        {/* Desktop: pill with portal icon + label */}
        <Tooltip content={t("portals.switchPortal")} placement="top">
          <Button
            color="primary"
            onPress={openDrawer}
            aria-label={t("portals.switchPortal")}
            className={cn(
              "hidden md:flex h-14 min-w-14 rounded-full font-bold",
              "shadow-xl shadow-primary/35 px-4 gap-2",
              "hover:scale-105 active:scale-95 transition-transform"
            )}
            startContent={<ActiveIcon className="h-5 w-5 shrink-0" />}
          >
            <span className="max-w-[120px] truncate">{label}</span>
          </Button>
        </Tooltip>

        <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-default-500 pointer-events-none">
          {t("portals.allApps")}
        </span>
      </div>

      <PortalPickerDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

/** @deprecated Use PortalFloatingButton */
export const PortalSwitcher = PortalFloatingButton;
