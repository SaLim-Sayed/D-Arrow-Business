import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationsService } from "./notifications.service";
import { canApproveDocuments } from "@/lib/permissions/document-approval";
import type { UserRole } from "@/features/auth/types/auth.types";

export type ApprovalDocumentKind = "quotation" | "contract" | "invoice";

const LINKS: Record<ApprovalDocumentKind, string> = {
  quotation: "/crm/quotations",
  contract: "/crm/contracts",
  invoice: "/billing/invoices",
};

/**
 * Pings admins, managers, and super admins (except the creator) that a
 * document is waiting for their approval before print/send.
 */
export async function notifyDocumentApprovers(input: {
  companyId: string;
  senderId: string;
  senderName: string;
  kind: ApprovalDocumentKind;
  title: string;
}): Promise<void> {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(
    query(usersRef, where("companyId", "==", input.companyId))
  );

  const recipients = snapshot.docs
    .map((snap) => ({
      id: snap.id,
      role: snap.data().role as UserRole | undefined,
    }))
    .filter(
      (user) => user.id !== input.senderId && canApproveDocuments(user.role)
    );

  if (!recipients.length) return;

  await Promise.allSettled(
    recipients.map((user) =>
      NotificationsService.createNotification(input.companyId, {
        userId: user.id,
        type: "document_approval",
        title: input.senderName,
        message: input.title,
        link: LINKS[input.kind],
      })
    )
  );
}
