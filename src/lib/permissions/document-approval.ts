import type { UserRole } from "@/features/auth/types/auth.types";

export type DocumentApprovalStatus = "pending" | "approved";

export interface DocumentApprovalFields {
  approvalStatus?: DocumentApprovalStatus;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
}

/** Admins, managers, and super admins may approve documents and issue invoices immediately. */
export function canApproveDocuments(role: UserRole | undefined): boolean {
  return role === "super_admin" || role === "admin" || role === "manager";
}

/**
 * Documents created before approval existed have no field — keep them usable.
 * Employee-issued invoices are stored as `pending` until an admin/manager/super admin approves.
 */
export function isDocumentApproved(
  doc: DocumentApprovalFields | null | undefined
): boolean {
  if (!doc) return false;
  if (doc.approvalStatus == null) return true;
  return doc.approvalStatus === "approved";
}

/** Drafts and invoices waiting for approval cannot be printed or sent. */
export function isInvoiceActionsUnlocked(
  invoice: (DocumentApprovalFields & { status?: string }) | null | undefined
): boolean {
  if (!invoice) return false;
  if (invoice.status === "draft" || invoice.status === "pending") return false;
  return isDocumentApproved(invoice);
}

export function pendingApprovalFields(): {
  approvalStatus: "pending";
  approvedAt: null;
  approvedBy: null;
} {
  return {
    approvalStatus: "pending",
    approvedAt: null,
    approvedBy: null,
  };
}

export function approvedFields(userId: string): {
  approvalStatus: "approved";
  approvedAt: string;
  approvedBy: string;
} {
  return {
    approvalStatus: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: userId,
  };
}
