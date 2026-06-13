import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type {
  WhatsAppMessage,
  CreateWhatsAppMessageDTO,
} from "../types/whatsapp.types";

const base = createCrmCollectionService<
  WhatsAppMessage,
  CreateWhatsAppMessageDTO,
  Partial<CreateWhatsAppMessageDTO>
>(CRM_COLLECTIONS.whatsappMessages, "WhatsAppService", {
  entityType: "lead",
  entityId: "",
  phone: "",
  fromPhone: "",
  direction: "outbound",
  body: "",
  status: "manual",
  userId: "",
});

export const WhatsAppService = {
  getMessages: base.getAll,
  getMessageById: base.getById,
  createMessage: base.create,
  deleteMessage: base.delete,
};
