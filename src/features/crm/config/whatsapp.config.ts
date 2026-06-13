import { toInternationalWhatsAppPhone } from "../utils/phone.utils";

const rawBusinessPhone =
  (import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE as string | undefined) ||
  "01062913674";

/** Normalized business line used as the WhatsApp sender (e.g. 201062913674). */
export const WHATSAPP_BUSINESS_PHONE = toInternationalWhatsAppPhone(rawBusinessPhone);

export const WHATSAPP_BUSINESS_PHONE_DISPLAY = rawBusinessPhone;
