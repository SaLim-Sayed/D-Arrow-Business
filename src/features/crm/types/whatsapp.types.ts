import type { CrmEntityType } from "./crm.common.types";

export type WhatsAppMessageDirection = "inbound" | "outbound";
export type WhatsAppMessageStatus = "manual" | "sent" | "delivered" | "read" | "failed";

export interface WhatsAppMessage {
  id: string;
  entityType: CrmEntityType;
  entityId: string;
  phone: string;
  fromPhone?: string;
  direction: WhatsAppMessageDirection;
  body: string;
  status: WhatsAppMessageStatus;
  externalId?: string | null;
  userId: string;
  createdAt: string;
}

export type CreateWhatsAppMessageDTO = Omit<WhatsAppMessage, "id" | "createdAt">;
