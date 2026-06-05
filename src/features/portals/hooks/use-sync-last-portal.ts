import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPortalFromPath } from "@/lib/portal-permissions";
import { setLastPortal } from "@/features/portals/hooks/use-portals";

export function useSyncLastPortal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const portal = getPortalFromPath(pathname);
    if (portal === "tasks" || portal === "crm" || portal === "people") {
      setLastPortal(portal);
    }
  }, [pathname]);
}
