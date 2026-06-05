import { Outlet } from "react-router-dom";
import { PortalGuard } from "@/features/portals/components/PortalGuard";
import { PortalPageShell } from "@/features/portals/components/PortalPageShell";

export function TasksLayout() {
  return (
    <PortalGuard portal="tasks">
      <PortalPageShell portal="tasks">
        <Outlet />
      </PortalPageShell>
    </PortalGuard>
  );
}
