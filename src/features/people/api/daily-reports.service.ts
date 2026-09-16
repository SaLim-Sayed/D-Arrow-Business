import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type { 
  DailyReport, 
  CreateDailyReportDTO, 
  DailyReportFilters 
} from "../types/daily-report.types";

const SERVICE_NAME = "DailyReportsService";

function mapDailyReportDoc(id: string, data: Record<string, unknown>): DailyReport {
  return {
    id,
    companyId: typeof data.companyId === "string" ? data.companyId : "",
    employeeId: typeof data.employeeId === "string" ? data.employeeId : "",
    employeeName: typeof data.employeeName === "string" ? data.employeeName : "",
    userPhotoUrl: typeof data.userPhotoUrl === "string" ? data.userPhotoUrl : undefined,
    date: typeof data.date === "string" ? data.date : new Date().toISOString().split("T")[0],
    attendanceId: typeof data.attendanceId === "string" ? data.attendanceId : "",
    checkInTime: typeof data.checkInTime === "string" ? data.checkInTime : undefined,
    checkOutTime: typeof data.checkOutTime === "string" ? data.checkOutTime : undefined,
    totalHours: typeof data.totalHours === "number" ? data.totalHours : undefined,
    tasksCompleted: Array.isArray(data.tasksCompleted) ? data.tasksCompleted : [],
    tasksInProgress: Array.isArray(data.tasksInProgress) ? data.tasksInProgress : [],
    summary: typeof data.summary === "string" ? data.summary : "",
    blockers: typeof data.blockers === "string" ? data.blockers : "",
    planTomorrow: typeof data.planTomorrow === "string" ? data.planTomorrow : "",
    productivityRating: typeof data.productivityRating === "number" ? data.productivityRating : 5,
    status: (data.status as DailyReport["status"]) || (data.isSkipped ? "skipped" : "submitted"),
    isSkipped: !!data.isSkipped,
    skipReason: typeof data.skipReason === "string" ? data.skipReason : undefined,
    managerComment: typeof data.managerComment === "string" ? data.managerComment : undefined,
    managerRating: typeof data.managerRating === "number" ? data.managerRating : undefined,
    reviewedBy: typeof data.reviewedBy === "string" ? data.reviewedBy : undefined,
    reviewedByName: typeof data.reviewedByName === "string" ? data.reviewedByName : undefined,
    reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate().toISOString() : (data.reviewedAt as string | undefined),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt as string || new Date().toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt as string | undefined),
  };
}

export const DailyReportsService = {
  async createDailyReport(
    companyId: string,
    payload: CreateDailyReportDTO
  ): Promise<ApiResponse<DailyReport>> {
    return withLogging(SERVICE_NAME, "createDailyReport", (async () => {
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      const date = new Date().toISOString().split("T")[0];

      const docData: Record<string, unknown> = {
        companyId,
        employeeId: payload.employeeId,
        employeeName: payload.employeeName,
        userPhotoUrl: payload.userPhotoUrl || null,
        date,
        attendanceId: payload.attendanceId,
        checkInTime: payload.checkInTime || null,
        checkOutTime: payload.checkOutTime || null,
        totalHours: payload.totalHours || 0,
        tasksCompleted: payload.tasksCompleted || [],
        tasksInProgress: payload.tasksInProgress || [],
        summary: payload.summary || (payload.isSkipped ? "تخطي إدخال التقرير اليومي" : ""),
        blockers: payload.blockers || "",
        planTomorrow: payload.planTomorrow || "",
        productivityRating: payload.productivityRating || 5,
        status: payload.isSkipped ? "skipped" : "submitted",
        isSkipped: !!payload.isSkipped,
        skipReason: payload.skipReason || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(reportsRef, docData);

      // Link to attendance record
      if (payload.attendanceId) {
        try {
          const attendanceRef = doc(db, "companies", companyId, "attendance", payload.attendanceId);
          await updateDoc(attendanceRef, {
            hasDailyReport: !payload.isSkipped,
            skippedReport: !!payload.isSkipped,
            dailyReportId: docRef.id,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn("Failed to link daily report to attendance doc:", err);
        }
      }

      // Link to completed/in-progress tasks activity log
      const allTasks = [...(payload.tasksCompleted || []), ...(payload.tasksInProgress || [])];
      for (const t of allTasks) {
        if (!t.id) continue;
        try {
          const taskRef = doc(db, "companies", companyId, "tasks", t.id);
          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const taskData = taskSnap.data();
            const existingHistory = Array.isArray(taskData.history) ? taskData.history : [];
            existingHistory.push({
              id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              field: "daily_report",
              oldValue: "",
              newValue: payload.isSkipped 
                ? `الموظف ${payload.employeeName} قام بتخطي التقرير اليومي` 
                : `الموظف ${payload.employeeName} قام بإدراج المهمة في التقرير اليومي بتاريخ ${date}`,
              actor: { userId: payload.employeeId, userName: payload.employeeName },
              timestamp: new Date().toISOString(),
            });
            await updateDoc(taskRef, {
              history: existingHistory,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn(`Failed to append history to task ${t.id}:`, err);
        }
      }

      const createdSnap = await getDoc(docRef);
      return {
        data: mapDailyReportDoc(docRef.id, createdSnap.data() || {}),
        message: payload.isSkipped ? "تم تسجيل الخروج وتخطي التقرير" : "تم حفظ التقرير اليومي بنجاح",
      };
    })());
  },

  async getDailyReports(
    companyId: string,
    filters?: DailyReportFilters
  ): Promise<ApiResponse<DailyReport[]>> {
    return withLogging(SERVICE_NAME, "getDailyReports", (async () => {
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      let q = query(reportsRef, orderBy("createdAt", "desc"));

      if (filters?.employeeId) {
        q = query(reportsRef, where("employeeId", "==", filters.employeeId), orderBy("createdAt", "desc"));
      }

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map((docSnap) => mapDailyReportDoc(docSnap.id, docSnap.data()));

      if (filters?.startDate) {
        reports = reports.filter((r) => r.date >= filters.startDate!);
      }
      if (filters?.endDate) {
        reports = reports.filter((r) => r.date <= filters.endDate!);
      }
      if (filters?.status) {
        reports = reports.filter((r) => r.status === filters.status);
      }
      if (filters?.hasBlockers) {
        reports = reports.filter((r) => !!r.blockers && r.blockers.trim().length > 0);
      }

      return {
        data: reports,
        message: "Fetched daily reports successfully",
      };
    })());
  },

  async getDailyReportByAttendanceId(
    companyId: string,
    attendanceId: string
  ): Promise<ApiResponse<DailyReport | null>> {
    return withLogging(SERVICE_NAME, "getDailyReportByAttendanceId", (async () => {
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      const q = query(reportsRef, where("attendanceId", "==", attendanceId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { data: null, message: "No report found for attendance" };
      }

      const firstDoc = querySnapshot.docs[0];
      return {
        data: mapDailyReportDoc(firstDoc.id, firstDoc.data()),
        message: "Daily report fetched",
      };
    })());
  },

  async updateManagerReview(
    companyId: string,
    reportId: string,
    review: { comment: string; rating?: number },
    reviewer: { id: string; name: string }
  ): Promise<ApiResponse<DailyReport>> {
    return withLogging(SERVICE_NAME, "updateManagerReview", (async () => {
      const reportRef = doc(db, "companies", companyId, "daily_reports", reportId);
      
      await updateDoc(reportRef, {
        managerComment: review.comment,
        managerRating: review.rating || null,
        reviewedBy: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: serverTimestamp(),
        status: "reviewed",
        updatedAt: serverTimestamp(),
      });

      const updatedSnap = await getDoc(reportRef);
      return {
        data: mapDailyReportDoc(reportId, updatedSnap.data() || {}),
        message: "Review submitted successfully",
      };
    })());
  },

  async appendCompletedTaskToTodayReport(
    companyId: string,
    user: { id: string; name?: string; avatar?: string },
    task: { id: string; title: string }
  ): Promise<ApiResponse<void>> {
    return withLogging(SERVICE_NAME, "appendCompletedTaskToTodayReport", (async () => {
      const date = new Date().toISOString().split("T")[0];
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      const q = query(
        reportsRef,
        where("employeeId", "==", user.id),
        where("date", "==", date)
      );
      const snap = await getDocs(q);

      const newTaskItem = {
        id: task.id,
        title: task.title,
        status: "done",
      };

      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        const data = snap.docs[0].data();
        const existingCompleted = Array.isArray(data.tasksCompleted) ? data.tasksCompleted : [];

        if (!existingCompleted.some((t: any) => t.id === task.id)) {
          existingCompleted.push(newTaskItem);
          const updatedSummary =
            data.summary && data.summary.trim()
              ? `${data.summary}\n• تم إكمال: "${task.title}"`
              : `تم إكمال وتأكيد المهمة تلقائياً: "${task.title}"`;

          await updateDoc(docRef, {
            tasksCompleted: existingCompleted,
            summary: updatedSummary,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        await addDoc(reportsRef, {
          companyId,
          employeeId: user.id,
          employeeName: user.name || "سالم السيد",
          userPhotoUrl: user.avatar || null,
          date,
          attendanceId: "auto-generated",
          tasksCompleted: [newTaskItem],
          tasksInProgress: [],
          summary: `تم إكمال وتأكيد المهمة تلقائياً: "${task.title}"`,
          blockers: "",
          planTomorrow: "",
          productivityRating: 5,
          status: "submitted",
          isSkipped: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return { data: undefined, message: "Task added to daily report" };
    })());
  },
};
