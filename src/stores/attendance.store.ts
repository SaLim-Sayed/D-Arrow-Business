import { create } from "zustand";
import { PeopleService } from "@/features/people/api/people.service";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import { useAuthStore } from "./auth.store";
import { AttendanceNotificationService } from "@/features/people/api/attendance-notifications.service";
import { captureAttendanceGeo } from "@/features/people/utils/attendance-geo-check";
import { AttendanceGeoError } from "@/features/people/utils/geo";
import i18n from "@/lib/i18n";

const at = (key: string, opts?: Record<string, unknown>) =>
  i18n.t(key, { ns: "people", ...opts });

function geoErrorToast(error: unknown, fallbackKey: "checkin_failed" | "checkout_failed"): string {
  if (error instanceof AttendanceGeoError) {
    if (error.code === "permission_denied") return at("attendance_toast.gps_denied");
    if (error.code === "unavailable" || error.code === "timeout") {
      return at("attendance_toast.gps_unavailable");
    }
    if (error.code === "not_assigned") return at("attendance_toast.location_not_assigned");
    if (error.code === "outside") {
      return at("attendance_toast.outside_location", {
        name: error.extra?.locationName ?? "",
        distance: error.extra?.distanceMeters ?? "—",
        radius: error.extra?.radiusMeters ?? "—",
      });
    }
  }
  return at(`attendance_toast.${fallbackKey}`);
}

interface AttendanceState {
  liveSeconds: number;
  accumulatedSeconds: number;
  isOnBreak: boolean;
  isShiftLoading: boolean;
  todayAttendance: any | null;
  intervalId: any | null;
  employeeId: string | null;
  isInitialized: boolean;
  startTime: number | null; // For precise drift-free calculation
  isReportModalOpen: boolean;
  
  setReportModalOpen: (open: boolean) => void;
  startTimer: () => void;
  stopTimer: () => void;
  
  checkIn: (companyId: string, employeeId: string, userId: string) => Promise<void>;
  takeBreak: (companyId: string, attendanceId: string, employeeId: string, userId: string) => Promise<void>;
  checkOut: (companyId: string, attendanceId: string, employeeId: string, userId: string) => Promise<void>;
  syncWithDb: (companyId: string, userId: string) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  liveSeconds: 0,
  accumulatedSeconds: 0,
  isOnBreak: false,
  isShiftLoading: false,
  todayAttendance: null,
  intervalId: null,
  employeeId: null,
  isInitialized: false,
  startTime: null,
  isReportModalOpen: false,

  setReportModalOpen: (open: boolean) => set({ isReportModalOpen: open }),

  startTimer: () => {
    if (get().intervalId) return;
    
    const tick = () => {
      const { todayAttendance } = get();
      if (!todayAttendance) return;
      
      const checkInTime = todayAttendance.checkIn instanceof Date 
        ? todayAttendance.checkIn 
        : new Date(todayAttendance.checkIn as any);
      
      const now = new Date().getTime();
      const elapsed = Math.floor((now - checkInTime.getTime()) / 1000);
      
      // Only update if value changed to minimize re-renders
      if (get().liveSeconds !== elapsed) {
        set({ liveSeconds: elapsed > 0 ? elapsed : 0 });
      }
    };

    tick(); // Initial tick
    const id = setInterval(tick, 1000);
    set({ intervalId: id });
  },

  stopTimer: () => {
    if (get().intervalId) {
      clearInterval(get().intervalId);
      set({ intervalId: null });
    }
  },

  checkIn: async (companyId, employeeId, userId) => {
    let finalEmployeeId = employeeId || get().employeeId;
    if (!companyId || !finalEmployeeId) {
      await get().syncWithDb(companyId, userId);
      finalEmployeeId = get().employeeId;
      if (!finalEmployeeId) return;
    }
    
    set({ isShiftLoading: true });
    try {
      const wasOnBreak = get().isOnBreak;
      const geo = await captureAttendanceGeo(companyId, finalEmployeeId);
      const res = await PeopleService.checkIn(companyId, finalEmployeeId, geo);
      set({ 
        isOnBreak: false, 
        todayAttendance: res.data,
        liveSeconds: 0 
      });
      get().startTimer();
      await get().syncWithDb(companyId, userId);
      toast.success(at("attendance_toast.shift_started"));

      const authUser = useAuthStore.getState().user;
      if (authUser) {
        if (wasOnBreak) {
          AttendanceNotificationService.notifyWorkResumed(companyId, authUser.name, finalEmployeeId);
        } else {
          AttendanceNotificationService.notifyWorkStarted(companyId, authUser.name, finalEmployeeId);
        }
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error(geoErrorToast(error, "checkin_failed"));
    } finally {
      set({ isShiftLoading: false });
    }
  },

  takeBreak: async (companyId, attendanceId, employeeId, userId) => {
    const finalEmployeeId = employeeId || get().employeeId;
    if (!companyId || !finalEmployeeId || !attendanceId) return;
    set({ isShiftLoading: true });
    try {
      await PeopleService.checkOut(companyId, attendanceId, finalEmployeeId, "on-break");
      get().stopTimer();
      await get().syncWithDb(companyId, userId);
      toast.success(at("attendance_toast.break_started"));
    } catch (error) {
      toast.error(at("attendance_toast.break_failed"));
    } finally {
      set({ isShiftLoading: false });
    }
  },

  checkOut: async (companyId, attendanceId, employeeId, userId) => {
    const finalEmployeeId = employeeId || get().employeeId;
    if (!companyId || !finalEmployeeId || !attendanceId) return;
    set({ isShiftLoading: true });
    try {
      const totalSeconds = get().accumulatedSeconds + get().liveSeconds;
      const geo = await captureAttendanceGeo(companyId, finalEmployeeId);
      await PeopleService.checkOut(
        companyId,
        attendanceId,
        finalEmployeeId,
        "off-duty",
        geo
      );
      get().stopTimer();
      await get().syncWithDb(companyId, userId);
      toast.success(at("attendance_toast.shift_completed"));

      const authUser = useAuthStore.getState().user;
      if (authUser) {
        AttendanceNotificationService.notifyShiftCompleted(companyId, authUser.name, totalSeconds, finalEmployeeId);
      }
    } catch (error) {
      toast.error(geoErrorToast(error, "checkout_failed"));
    } finally {
      set({ isShiftLoading: false });
    }
  },

  syncWithDb: async (companyId, userId) => {
    if (!companyId || !userId) return;
    try {
      const employeesRef = collection(db, "companies", companyId, "employees");
      const authUser = useAuthStore.getState().user;
      const authEmail = authUser?.email?.trim().toLowerCase() || "";

      let employeeDoc: DocumentSnapshot<DocumentData> | undefined = (
        await getDocs(query(employeesRef, where("userId", "==", userId)))
      ).docs[0];

      if (!employeeDoc) {
        const allEmpSnap = await getDocs(employeesRef);
        employeeDoc = allEmpSnap.docs.find((d) => d.data().userId === userId);

        // The hire flow creates the employee record before the person ever signs
        // in, and it carries no userId yet. Whichever provider they use (Google
        // included), their record is claimed by email instead of creating a
        // second one that would split their attendance in two.
        if (!employeeDoc && authEmail) {
          const byEmail = allEmpSnap.docs.find(
            (d) => String(d.data().email ?? "").trim().toLowerCase() === authEmail
          );
          if (byEmail) {
            const existing = byEmail.data();
            const hasName = Boolean(existing.name || existing.firstName || existing.lastName);
            await updateDoc(byEmail.ref, {
              userId,
              ...(hasName || !authUser?.name ? {} : { name: authUser.name }),
              updatedAt: serverTimestamp(),
            });
            employeeDoc = byEmail;
          }
        }
      }

      if (!employeeDoc) {
        if (!authUser) {
          set({ isInitialized: true });
          return;
        }
        const newEmpDoc = await addDoc(employeesRef, {
          userId,
          name: authUser.name,
          email: authEmail || authUser.email,
          role: authUser.role || "employee",
          department: "General",
          shiftStatus: "off-duty",
          workType: "remote",
          attendanceCheckMode: "flexible",
          autoStartTimer: true,
          allowRemoteTimer: true,
          joiningDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        employeeDoc = await getDoc(newEmpDoc);
      }

      const employeeId = employeeDoc.id;
      const employeeData = employeeDoc.data() ?? {};
      set({ employeeId, isInitialized: true });

      const res = await PeopleService.getAttendance(companyId, employeeId);
      const today = new Date().toISOString().split("T")[0];
      
      const isGlobalOnBreak = employeeData.shiftStatus === "on-break";
      set({ isOnBreak: isGlobalOnBreak });

      const finishedToday = res.data.filter((a: any) => a.date === today && a.checkOut);
      const totalAccumulated = finishedToday.reduce((acc: number, curr: any) => acc + (curr.totalHours || 0), 0);
      set({ accumulatedSeconds: Math.floor(totalAccumulated * 3600) });

      const activeRecord = res.data.find((a: any) => a.date === today && !a.checkOut);
      if (activeRecord && !isGlobalOnBreak) {
        set({ todayAttendance: activeRecord });
        get().startTimer();
      } else {
        set({ todayAttendance: null, liveSeconds: 0 });
        get().stopTimer();
      }
    } catch (error) {
      console.error("[AttendanceStore] Sync Error:", error);
    }
  }
}));
