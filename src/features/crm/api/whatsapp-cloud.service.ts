import { API_BASE_URL } from "@/lib/constants";
import { toInternationalWhatsAppPhone } from "../utils/phone.utils";

export interface WhatsAppApiStatus {
  configured: boolean;
  mock?: boolean;
  businessPhone: string;
}

export interface SendWhatsAppCloudResult {
  messages?: Array<{ id: string }>;
}

export const WhatsAppCloudService = {
  async getStatus(): Promise<WhatsAppApiStatus> {
    const res = await fetch(`${API_BASE_URL}/whatsapp/status`);
    if (!res.ok) {
      return { configured: false, businessPhone: "" };
    }
    return res.json() as Promise<WhatsAppApiStatus>;
  },

  async sendMessage(to: string, body: string): Promise<SendWhatsAppCloudResult> {
    const res = await fetch(`${API_BASE_URL}/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toInternationalWhatsAppPhone(to),
        body: body.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        typeof data?.error === "string"
          ? data.error
          : data?.error?.message ?? "WhatsApp send failed";
      throw new Error(message);
    }

    return data as SendWhatsAppCloudResult;
  },
};
