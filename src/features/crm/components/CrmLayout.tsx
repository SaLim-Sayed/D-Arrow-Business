import { Outlet } from "react-router-dom";
import { CrmGuard } from "./CrmGuard";
import { CrmNotificationCenter } from "./CrmNotificationCenter";
import { CrmGlobalSearch } from "./CrmGlobalSearch";
import { PortalPageShell } from "@/features/portals/components/PortalPageShell";

export function CrmLayout() {
  return (
    <CrmGuard>
      <PortalPageShell
        portal="crm"
        maxWidth="wide"
        toolbar={
          <>
            <div className="flex-1 min-w-0 sm:flex-initial">
              <CrmGlobalSearch />
            </div>
            <CrmNotificationCenter />
          </>
        }
      >
        <Outlet />
      </PortalPageShell>
    </CrmGuard>
  );
}
