import type { UserRole } from "@/features/auth/types/auth.types";

export type DocumentApprovalStatus = "pending" | "approved";

export interface DocumentApprovalFields {
  approvalStatus?: DocumentApprovalStatus;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
}

/** Only company managers and super admins may approve documents. */
export function canApproveDocuments(role: UserRole | undefined): boolean {
  return role === "super_admin" || role === "manager";
}

/**
 * Documents created before approval existed have no field — keep them usable.
 * New documents are stored as `pending` until a manager/super admin approves.
 */
export function isDocumentApproved(
  doc: DocumentApprovalFields | null | undefined
): boolean {
  if (!doc) return false;
  if (doc.approvalStatus == null) return true;
  return doc.approvalStatus === "approved";
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
