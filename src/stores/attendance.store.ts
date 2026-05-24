import { create } from "zustand";
import { PeopleService } from "@/features/people/api/people.service";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "./auth.store";

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
      const res = await PeopleService.checkIn(companyId, finalEmployeeId);
      set({ 
        isOnBreak: false, 
        todayAttendance: res.data,
        liveSeconds: 0 
      });
      get().startTimer();
      await get().syncWithDb(companyId, userId);
      toast.success("Shift started!");
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in.");
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
      toast.success("Break started.");
    } catch (error) {
      toast.error("Failed to start break");
    } finally {
      set({ isShiftLoading: false });
    }
  },

  checkOut: async (companyId, attendanceId, employeeId, userId) => {
    const finalEmployeeId = employeeId || get().employeeId;
    if (!companyId || !finalEmployeeId || !attendanceId) return;
    set({ isShiftLoading: true });
    try {
      await PeopleService.checkOut(companyId, attendanceId, finalEmployeeId, "off-duty");
      get().stopTimer();
      await get().syncWithDb(companyId, userId);
      toast.success("Shift completed.");
    } catch (error) {
      toast.error("Failed to check out");
    } finally {
      set({ isShiftLoading: false });
    }
  },

  syncWithDb: async (companyId, userId) => {
    if (!companyId || !userId) return;
    try {
      const employeesRef = collection(db, "companies", companyId, "employees");
      const q = query(employeesRef, where("userId", "==", userId));
      let empSnap = await getDocs(q);
      
      if (empSnap.empty) {
        const allEmpSnap = await getDocs(employeesRef);
        const found = allEmpSnap.docs.find(d => d.data().userId === userId);
        if (found) empSnap = { docs: [found], empty: false } as any;
      }
      
      if (empSnap.empty) {
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          const newEmpDoc = await addDoc(employeesRef, {
            userId,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role || "employee",
            department: "General",
            shiftStatus: "off-duty",
            joiningDate: new Date().toISOString(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const createdDoc = await getDoc(newEmpDoc);
          empSnap = { docs: [createdDoc], empty: false } as any;
        } else {
          set({ isInitialized: true });
          return;
        }
      }
      
      const employeeDoc = empSnap.docs[0];
      const employeeId = employeeDoc.id;
      const employeeData = employeeDoc.data();
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
