import { useEffect } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCompany } from "@/features/companies/context/company-context";
import { useAttendanceStore } from "@/stores/attendance.store";

export function AttendanceInitializer() {
  const { user, isAuthenticated } = useAuth();
  const { companyId } = useCompany();
  const { syncWithDb, stopTimer } = useAttendanceStore();

  useEffect(() => {
    if (isAuthenticated && user?.id && companyId) {
      console.log(`[AttendanceInitializer] Triggering sync for user: ${user.id}`);
      syncWithDb(companyId, user.id);
    } else if (!isAuthenticated) {
      console.log("[AttendanceInitializer] User not authenticated, stopping timer");
      stopTimer();
    }
  }, [isAuthenticated, user?.id, companyId, syncWithDb, stopTimer]);

  return null;
}
