export interface WhatsAppEnv {
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_PHONE?: string;
  VITE_WHATSAPP_BUSINESS_PHONE?: string;
  WHATSAPP_MOCK_SEND?: string;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export function isWhatsAppMockMode(env: WhatsAppEnv): boolean {
  return env.WHATSAPP_MOCK_SEND?.trim().toLowerCase() === "true";
}

export function getWhatsAppConfig(env: WhatsAppEnv) {
  return {
    token: env.WHATSAPP_ACCESS_TOKEN?.trim() || "",
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
    businessPhone:
      env.WHATSAPP_BUSINESS_PHONE?.trim() ||
      env.VITE_WHATSAPP_BUSINESS_PHONE?.trim() ||
      "01062913674",
    mock: isWhatsAppMockMode(env),
  };
}

export function getWhatsAppStatus(env: WhatsAppEnv): ApiResult {
  const { token, phoneNumberId, businessPhone, mock } = getWhatsAppConfig(env);
  const configured = mock || !!(token && phoneNumberId);
  return {
    status: 200,
    body: {
      configured,
      mock,
      businessPhone,
    },
  };
}

export async function sendWhatsAppMessage(
  env: WhatsAppEnv,
  payload: { to?: string; body?: string }
): Promise<ApiResult> {
  const { token, phoneNumberId, businessPhone, mock } = getWhatsAppConfig(env);

  const recipient = (payload.to ?? "").replace(/\D/g, "");
  const text = payload.body?.trim();

  if (!recipient || !text) {
    return {
      status: 400,
      body: { error: "Missing recipient phone or message body" },
    };
  }

  if (mock) {
    const mockId = `wamid.mock_${Date.now()}`;
    console.info("[WhatsApp MOCK]", {
      from: businessPhone,
      to: recipient,
      body: text,
      messageId: mockId,
    });
    return {
      status: 200,
      body: {
        messaging_product: "whatsapp",
        mock: true,
        messages: [{ id: mockId }],
      },
    };
  }

  if (!token || !phoneNumberId) {
    return {
      status: 503,
      body: {
        error:
          "WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env (local) or Vercel, or set WHATSAPP_MOCK_SEND=true for local testing.",
      },
    };
  }

  const graphRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: text },
      }),
    }
  );

  const data = (await graphRes.json().catch(() => ({}))) as {
    error?: { message?: string };
    messages?: Array<{ id: string }>;
  };

  if (!graphRes.ok) {
    const message =
      typeof data.error === "object" && data.error?.message
        ? data.error.message
        : "WhatsApp API request failed";
    return {
      status: graphRes.status,
      body: { error: message, details: data },
    };
  }

  return { status: 200, body: data as Record<string, unknown> };
}
