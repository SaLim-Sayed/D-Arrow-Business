import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./header";
import { PortalSidebar } from "./portal-sidebar";
import { useSyncLastPortal } from "@/features/portals/hooks/use-sync-last-portal";
import { getPortalFromPath } from "@/lib/portal-permissions";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";

export function AppLayout() {
  useSyncLastPortal();
  const { pathname } = useLocation();
  const { sidebarCollapsed } = useLayoutStore();
  const portal = getPortalFromPath(pathname);
  const isPicker = portal === "picker";
  const showSidebar =
    portal === "tasks" ||
    portal === "crm" ||
    portal === "people" ||
    portal === "billing" ||
    portal === "chat";

  return (
    <div className="min-h-screen bg-background">
      {showSidebar && <PortalSidebar portal={portal} />}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          showSidebar && (sidebarCollapsed ? "md:ps-20" : "md:ps-64")
        )}
      >
        <Header
          hasPortalSidebar={showSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main
          className={cn(
            "flex-1 pt-14 sm:pt-16",
            isPicker ? "px-4 pb-4 md:px-8 md:pb-8" : "px-4 pb-4 md:px-6 md:pb-6"
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
