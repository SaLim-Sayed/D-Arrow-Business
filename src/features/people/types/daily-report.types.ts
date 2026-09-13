import type { Timestamp } from "firebase/firestore";

export interface TaskSummaryRef {
  id: string;
  title: string;
  status?: string;
  projectId?: string;
  projectTitle?: string;
}

export type DailyReportStatus = "submitted" | "skipped" | "reviewed";

export interface DailyReport {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  userPhotoUrl?: string;
  date: string; // ISO format YYYY-MM-DD
  attendanceId: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  
  // Work Details
  tasksCompleted: TaskSummaryRef[];
  tasksInProgress: TaskSummaryRef[];
  summary: string;
  blockers?: string;
  planTomorrow?: string;
  productivityRating: number; // 1 to 5
  
  // Emergency Skip
  status: DailyReportStatus;
  isSkipped?: boolean;
  skipReason?: string;
  
  // Manager Review / HR Feedback
  managerComment?: string;
  managerRating?: number;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string | Timestamp;
  
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface CreateDailyReportDTO {
  employeeId: string;
  employeeName: string;
  userPhotoUrl?: string;
  attendanceId: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  
  tasksCompleted: TaskSummaryRef[];
  tasksInProgress: TaskSummaryRef[];
  summary: string;
  blockers?: string;
  planTomorrow?: string;
  productivityRating: number;
  
  isSkipped?: boolean;
  skipReason?: string;
}

export interface DailyReportFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: DailyReportStatus;
  hasBlockers?: boolean;
}
