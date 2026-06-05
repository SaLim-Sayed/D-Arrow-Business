import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PORTAL_PATHS,
  getPortalFromPath,
  type PortalId,
} from "@/lib/portal-permissions";
import {
  useAccessiblePortals,
  setLastPortal,
} from "@/features/portals/hooks/use-portals";
import { PORTAL_META } from "@/features/portals/constants/portal-meta";
import { usePortalStat } from "@/features/portals/hooks/use-portal-stats";
import { useLocation } from "react-router-dom";

interface PortalPickerDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function PortalDrawerItem({
  portal,
  isActive,
  onSelect,
}: {
  portal: PortalId;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const meta = PORTAL_META[portal];
  const Icon = meta.icon;
  const stat = usePortalStat(portal);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-4 rounded-2xl p-4 text-start transition-all",
        "hover:bg-default-100 active:scale-[0.99]",
        isActive
          ? "bg-primary/10 ring-2 ring-primary/30"
          : "bg-default-50/50 border border-default-100"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-base truncate">{t(meta.titleKey)}</p>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
              <Check className="h-3 w-3" />
              {t("portals.active")}
            </span>
          )}
        </div>
        <p className="text-sm text-default-500 mt-0.5 line-clamp-2">
          {t(meta.descKey)}
        </p>
        {stat !== null && (
          <p className="text-xs font-semibold text-primary mt-1.5">
            {t(meta.statKey, { count: stat })}
          </p>
        )}
      </div>
      {!isActive && (
        <ChevronRight className="h-5 w-5 shrink-0 text-default-300" />
      )}
    </button>
  );
}

export function PortalPickerDrawer({
  isOpen,
  onOpenChange,
}: PortalPickerDrawerProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const current = getPortalFromPath(location.pathname);

  function selectPortal(portal: PortalId) {
    setLastPortal(portal);
    navigate(PORTAL_PATHS[portal]);
    onOpenChange(false);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={i18n.language === "ar" ? "right" : "left"}
      size="full"
      classNames={{
        base: "bg-background/95 backdrop-blur-xl sm:max-w-sm sm:w-full",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1 border-b border-default-100 pb-4">
          <h2 className="text-lg font-black tracking-tight">
            {t("portals.pickerTitle")}
          </h2>
          <p className="text-sm font-normal text-default-500">
            {t("portals.pickerSubtitle")}
          </p>
        </DrawerHeader>
        <DrawerBody className="gap-3 py-4">
          {portals.map((portal) => (
            <PortalDrawerItem
              key={portal}
              portal={portal}
              isActive={current === portal}
              onSelect={() => selectPortal(portal)}
            />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
