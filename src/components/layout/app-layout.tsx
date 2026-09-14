import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./header";
import { PortalSidebar } from "./portal-sidebar";
import { PortalPickerDrawer } from "@/features/portals/components/PortalPickerDrawer";
import { useSyncLastPortal } from "@/features/portals/hooks/use-sync-last-portal";
import { useMeetingReminders } from "@/features/meetings/hooks/use-meeting-reminders";
import { getPortalFromPath } from "@/lib/portal-permissions";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";

export function AppLayout({ children }: { children?: React.ReactNode } = {}) {
  useSyncLastPortal();
  useMeetingReminders();
  const { pathname } = useLocation();
  const { sidebarCollapsed, portalPickerOpen, setPortalPickerOpen } =
    useLayoutStore();
  const portal = getPortalFromPath(pathname);
  const isPicker = portal === "picker";
  const showSidebar =
    portal === "tasks" ||
    portal === "crm" ||
    portal === "people" ||
    portal === "billing" ||
    portal === "chat";

  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-0 print:p-0">
      {showSidebar && <PortalSidebar portal={portal} />}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          showSidebar && (sidebarCollapsed ? "md:ps-[5.5rem]" : "md:ps-64"),
          "print:ps-0 print:ms-0 print:min-h-0 print:block"
        )}
      >
        <Header
          hasPortalSidebar={showSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main
          className={cn(
            "flex-1 pt-14 sm:pt-16",
            isPicker ? "px-4 pb-4 md:px-8 md:pb-8" : "px-4 pb-4 md:px-6 md:pb-6",
            "print:pt-0 print:p-0 print:m-0 print:block"
          )}
        >
          {children ?? <Outlet />}
        </main>
      </div>
      <PortalPickerDrawer
        isOpen={portalPickerOpen}
        onOpenChange={setPortalPickerOpen}
      />
    </div>
  );
}
