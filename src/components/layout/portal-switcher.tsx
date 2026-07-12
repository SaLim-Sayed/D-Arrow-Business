import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GripVertical, LayoutGrid } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";
import { getPortalFromPath, type PortalId } from "@/lib/portal-permissions";
import { PORTAL_META } from "@/features/portals/constants/portal-meta";
import { PortalPickerDrawer } from "@/features/portals/components/PortalPickerDrawer";
import { useLayoutStore } from "@/stores/layout.store";

const DRAG_THRESHOLD_PX = 8;
const FAB_EDGE_PAD = 8;

function clampFabPosition(x: number, y: number, width: number, height: number) {
  const maxX = Math.max(FAB_EDGE_PAD, window.innerWidth - width - FAB_EDGE_PAD);
  const maxY = Math.max(FAB_EDGE_PAD, window.innerHeight - height - FAB_EDGE_PAD);
  return {
    x: Math.min(Math.max(FAB_EDGE_PAD, x), maxX),
    y: Math.min(Math.max(FAB_EDGE_PAD, y), maxY),
  };
}

export function PortalFloatingButton() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const current = getPortalFromPath(location.pathname);
  const {
    portalPickerOpen,
    setPortalPickerOpen,
    portalFabPosition,
    setPortalFabPosition,
  } = useLayoutStore();
  const [localOpen, setLocalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [livePosition, setLivePosition] = useState<{ x: number; y: number } | null>(
    null
  );

  const fabRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const openTimerRef = useRef<number | null>(null);

  const isRtl = i18n.language === "ar";
  const drawerOpen = portalPickerOpen || localOpen;
  const position = livePosition ?? portalFabPosition;

  const setDrawerOpen = (open: boolean) => {
    setLocalOpen(open);
    setPortalPickerOpen(open);
  };

  const openDrawer = () => {
    setLocalOpen(true);
    setPortalPickerOpen(true);
  };

  const scheduleOpenDrawer = () => {
    if (openTimerRef.current != null) {
      window.clearTimeout(openTimerRef.current);
    }
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      openDrawer();
    }, 220);
  };

  useEffect(
    () => () => {
      if (openTimerRef.current != null) {
        window.clearTimeout(openTimerRef.current);
      }
    },
    []
  );

  const persistPosition = (next: { x: number; y: number }) => {
    const el = fabRef.current;
    if (!el) {
      setPortalFabPosition(next);
      return;
    }
    const rect = el.getBoundingClientRect();
    setPortalFabPosition(clampFabPosition(next.x, next.y, rect.width, rect.height));
  };

  useEffect(() => {
    if (!portalFabPosition) return;

    const onResize = () => {
      const el = fabRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPortalFabPosition(
        clampFabPosition(portalFabPosition.x, portalFabPosition.y, rect.width, rect.height)
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [portalFabPosition, setPortalFabPosition]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const el = fabRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const origin =
      position ?? clampFabPosition(rect.left, rect.top, rect.width, rect.height);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    if (!dragRef.current.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }

    if (!dragRef.current.moved) return;

    const el = fabRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const next = clampFabPosition(
      dragRef.current.originX + dx,
      dragRef.current.originY + dy,
      rect.width,
      rect.height
    );
    dragPositionRef.current = next;
    setLivePosition(next);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const wasDrag = dragRef.current.moved;
    dragRef.current.pointerId = -1;

    if (wasDrag && dragPositionRef.current) {
      persistPosition(dragPositionRef.current);
    } else if (!wasDrag) {
      scheduleOpenDrawer();
    }

    dragPositionRef.current = null;
    setLivePosition(null);
    setIsDragging(false);
  };

  const onDoubleClick = () => {
    if (openTimerRef.current != null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setPortalFabPosition(null);
    setLivePosition(null);
  };

  if (portals.length <= 1) return null;

  const activePortal: PortalId | null =
    current === "tasks" || current === "crm" || current === "people"
      ? current
      : null;

  const activeMeta = activePortal ? PORTAL_META[activePortal] : null;
  const ActiveIcon = activeMeta?.icon ?? LayoutGrid;
  const label = activeMeta ? t(activeMeta.shortKey) : t("portals.allApps");

  return (
    <>
      <div
        ref={fabRef}
        role="button"
        tabIndex={0}
        aria-label={t("portals.switchPortal")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onDoubleClick={onDoubleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDrawer();
          }
        }}
        style={
          position
            ? { left: position.x, top: position.y }
            : undefined
        }
        className={cn(
          "fixed z-[200] flex touch-none select-none flex-col items-center gap-1 outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          position
            ? "cursor-grab"
            : cn(
                "bottom-[max(1rem,env(safe-area-inset-bottom))] md:bottom-6",
                isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
              ),
          isDragging && "cursor-grabbing scale-[1.03] z-[201]"
        )}
      >
        <Tooltip
          content={
            position
              ? t("portals.dragHintCustom")
              : t("portals.dragHint")
          }
          placement="top"
          isDisabled={isDragging}
        >
          <div className="relative">
            {/* Soft ambient glow, breathing gently behind the button */}
            <span
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary to-secondary blur-lg",
                "opacity-40 animate-pulse-slow",
                "group-hover:opacity-60"
              )}
              aria-hidden
            />

            <div
              className={cn(
                "group relative flex items-center gap-2 overflow-hidden rounded-full",
                "bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground",
                "shadow-xl shadow-primary/40 transition-all duration-300",
                "hover:scale-105 hover:shadow-2xl hover:shadow-secondary/40 active:scale-95",
                "md:h-14 md:min-w-14 md:px-4 md:font-bold",
                "h-14 w-14 justify-center md:w-auto",
                "ring-4 ring-background/80 backdrop-blur-sm md:ring-0"
              )}
            >
              {/* Diagonal shine that sweeps across on hover */}
              <span
                className={cn(
                  "pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30",
                  "-translate-x-[150%] transition-transform duration-700 ease-out",
                  "group-hover:translate-x-[250%]"
                )}
                aria-hidden
              />

              <span
                className={cn(
                  "absolute -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-content1 text-default-400 shadow-sm",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                  isDragging && "opacity-100",
                  isRtl ? "-left-1" : "-right-1"
                )}
                aria-hidden
              >
                <GripVertical className="h-3 w-3" />
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-default-100 md:hidden">
                <Logo size="sm" variant="icon" className="h-7 w-7 [&_img]:h-7" />
              </span>

              <span className="hidden md:inline-flex md:items-center md:gap-2">
                <ActiveIcon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
                <span className="max-w-[120px] truncate">{label}</span>
              </span>
            </div>
          </div>
        </Tooltip>

        <span className="pointer-events-none text-[10px] font-bold uppercase tracking-wider text-default-500 md:hidden">
          {t("portals.allApps")}
        </span>
      </div>

      <PortalPickerDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

/** @deprecated Use PortalFloatingButton */
export const PortalSwitcher = PortalFloatingButton;
