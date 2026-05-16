import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAttendanceStore } from "@/stores/attendance.store";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCompany } from "@/features/companies/context/company-context";

export function useAttendanceTimer() {
  const store = useAttendanceStore(useShallow((state) => ({
    todayAttendance: state.todayAttendance,
    isOnBreak: state.isOnBreak,
    liveSeconds: state.liveSeconds,
    accumulatedSeconds: state.accumulatedSeconds,
    isShiftLoading: state.isShiftLoading,
    isInitialized: state.isInitialized,
    checkIn: state.checkIn,
    takeBreak: state.takeBreak,
    checkOut: state.checkOut,
  })));
  
  const { user } = useAuth();
  const { companyId } = useCompany();

  const formatLiveTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  return {
    todayAttendance: store.todayAttendance,
    isOnBreak: store.isOnBreak,
    liveSeconds: store.liveSeconds,
    accumulatedSeconds: store.accumulatedSeconds,
    isShiftLoading: store.isShiftLoading,
    handleCheckIn: () => store.checkIn(companyId || "", "", user?.id || ""),
    handleTakeBreak: () => {
      if (store.todayAttendance) store.takeBreak(companyId || "", store.todayAttendance.id, "", user?.id || "");
    },
    handleCheckOut: () => {
      if (store.todayAttendance) store.checkOut(companyId || "", store.todayAttendance.id, "", user?.id || "");
    },
    formatLiveTime,
    isLoading: !store.isInitialized,
    isCheckedIn: !!store.todayAttendance && !store.todayAttendance.checkOut && !store.isOnBreak
  };
}
