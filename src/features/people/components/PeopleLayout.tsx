import { Outlet } from "react-router-dom";
import { PortalGuard } from "@/features/portals/components/PortalGuard";
import { PortalPageShell } from "@/features/portals/components/PortalPageShell";

export function PeopleLayout() {
  return (
    <PortalGuard portal="people">
      <PortalPageShell portal="people">
        <Outlet />
      </PortalPageShell>
    </PortalGuard>
  );
}
