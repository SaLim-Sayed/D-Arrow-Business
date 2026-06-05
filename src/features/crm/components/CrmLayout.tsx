import { Outlet } from "react-router-dom";
import { CrmGuard } from "./CrmGuard";
import { CrmSubNav } from "./CrmSubNav";
import { CrmNotificationCenter } from "./CrmNotificationCenter";
import { CrmGlobalSearch } from "./CrmGlobalSearch";

export function CrmLayout() {
  return (
    <CrmGuard>
      <div className="space-y-4 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0 overflow-hidden">
            <CrmSubNav />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CrmGlobalSearch />
            <CrmNotificationCenter />
          </div>
        </div>
        <Outlet />
      </div>
    </CrmGuard>
  );
}
