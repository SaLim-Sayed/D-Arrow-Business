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

function toMillis(value: string | Timestamp | undefined): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

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
    productivityRating: typeof data.productivityRating === "number" ? data.productivityRating : undefined,
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
      // Combining the employee filter with orderBy would need a composite index, so
      // scoped queries sort in memory instead — a single member's history is small.
      const q = filters?.employeeId
        ? query(reportsRef, where("employeeId", "==", filters.employeeId))
        : query(reportsRef, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map((docSnap) => mapDailyReportDoc(docSnap.id, docSnap.data()));

      if (filters?.employeeId) {
        reports.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      }

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

  /**
   * Pass `employeeId` when the caller is not a manager: security rules only allow
   * listing daily reports that are constrained to the signed-in user.
   */
  async getDailyReportByAttendanceId(
    companyId: string,
    attendanceId: string,
    employeeId?: string
  ): Promise<ApiResponse<DailyReport | null>> {
    return withLogging(SERVICE_NAME, "getDailyReportByAttendanceId", (async () => {
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      const q = employeeId
        ? query(
            reportsRef,
            where("employeeId", "==", employeeId),
            where("attendanceId", "==", attendanceId)
          )
        : query(reportsRef, where("attendanceId", "==", attendanceId));
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
          status: "submitted",
          isSkipped: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return { data: undefined, message: "Task added to daily report" };
    })());
  },

  async addSalimQuickReports(companyId: string, user: { id: string; name: string; avatar?: string }): Promise<ApiResponse<void>> {
    return withLogging(SERVICE_NAME, "addAccountingWeekReports", (async () => {
      const days = [
        ["2026-10-03", "18:10", "22:35", 4.42, "تحليل نظام المحاسبة وإعداد خطة الفصل"],
        ["2026-10-04", "18:25", "22:50", 4.42, "توسيع شجرة الحسابات والترجمات"],
        ["2026-10-05", "18:05", "22:40", 4.58, "إنشاء مشروع المحاسبة وقاعدة البيانات المستقلة"],
        ["2026-10-06", "18:30", "23:10", 4.67, "فصل تسجيل الدخول والمستخدمين والصلاحيات"],
        ["2026-10-07", "18:15", "22:45", 4.5, "تخصيص واجهة الدخول والقائمة والشريط العلوي"],
        ["2026-10-08", "18:20", "23:05", 4.75, "اختبار النظام المستقل والتحقق من البناء"],
      ] as const;
      const reportsRef = collection(db, "companies", companyId, "daily_reports");
      const attendanceRef = collection(db, "companies", companyId, "attendance");

      for (const [date, start, end, totalHours, title] of days) {
        const attendancePayload = {
          employeeId: user.id,
          date,
          checkIn: new Date(`${date}T${start}:00+03:00`),
          checkOut: new Date(`${date}T${end}:00+03:00`),
          totalHours,
          status: "present",
          notes: "عمل مسائي على تطوير وفصل نظام المحاسبة",
          hasDailyReport: true,
          updatedAt: serverTimestamp(),
        };
        const oldAttendance = await getDocs(query(attendanceRef, where("employeeId", "==", user.id), where("date", "==", date)));
        let attendanceId = oldAttendance.docs[0]?.id;
        if (attendanceId) {
          await updateDoc(doc(db, "companies", companyId, "attendance", attendanceId), attendancePayload);
        } else {
          const created = await addDoc(attendanceRef, { ...attendancePayload, createdAt: serverTimestamp() });
          attendanceId = created.id;
        }

        const reportPayload = {
          companyId,
          employeeId: user.id,
          employeeName: user.name || "سالم السيد",
          userPhotoUrl: user.avatar || null,
          date,
          attendanceId,
          checkInTime: start,
          checkOutTime: end,
          totalHours,
          tasksCompleted: [{ id: `accounting-${date}`, title, status: "done" }],
          tasksInProgress: [],
          summary: title,
          blockers: "",
          planTomorrow: "استكمال تطوير واختبار نظام المحاسبة المستقل",
          status: "submitted",
          isSkipped: false,
          updatedAt: serverTimestamp(),
        };
        const oldReport = await getDocs(query(reportsRef, where("employeeId", "==", user.id), where("date", "==", date)));
        if (oldReport.empty) {
          await addDoc(reportsRef, { ...reportPayload, createdAt: serverTimestamp() });
        } else {
          await updateDoc(doc(db, "companies", companyId, "daily_reports", oldReport.docs[0].id), reportPayload);
        }
      }
      return { data: undefined, message: "تم تسجيل حضور وتقارير المحاسبة من 3 إلى 8 أكتوبر" };
    })());
  },
};
