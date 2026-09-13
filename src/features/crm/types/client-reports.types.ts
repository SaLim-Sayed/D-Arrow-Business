export type ClientReportType =
  | "meeting_summary"
  | "status_update"
  | "sales_pitch"
  | "complaint_resolution"
  | "quarterly_review"
  | "general";

export type ClientMood =
  | "satisfied"
  | "neutral"
  | "needs_attention"
  | "at_risk";

export type ClientReportStatus = "draft" | "submitted" | "reviewed";

export interface ReportActionItem {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
}

export interface ClientReport {
  id: string;
  companyId: string;
  contactId: string;
  contactName: string;
  dealId?: string;
  dealTitle?: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  title: string;
  reportType: ClientReportType;
  content: string; // Rich text HTML / formatted markdown
  keyOutcomes?: string[];
  actionItems?: ReportActionItem[];
  clientMood: ClientMood;
  satisfactionRating?: number; // 1 to 5 stars
  status: ClientReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientReportDTO {
  contactId: string;
  contactName: string;
  dealId?: string;
  dealTitle?: string;
  title: string;
  reportType: ClientReportType;
  content: string;
  keyOutcomes?: string[];
  actionItems?: ReportActionItem[];
  clientMood: ClientMood;
  satisfactionRating?: number;
  status?: ClientReportStatus;
}

export interface UpdateClientReportDTO extends Partial<CreateClientReportDTO> {}
