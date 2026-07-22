import { Outlet } from "react-router-dom";
import { PortalGuard } from "@/features/portals/components/PortalGuard";
import { PortalPageShell } from "@/features/portals/components/PortalPageShell";
import { usePresenceHeartbeat } from "../hooks/use-presence";

export function ChatLayout() {
  usePresenceHeartbeat(true);

  return (
    <PortalGuard portal="chat">
      <PortalPageShell portal="chat" maxWidth="wide">
        <Outlet />
      </PortalPageShell>
    </PortalGuard>
  );
}
