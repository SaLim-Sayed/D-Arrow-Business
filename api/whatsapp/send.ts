import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendWhatsAppMessage } from "./lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await sendWhatsAppMessage(process.env, req.body as { to?: string; body?: string });
  return res.status(result.status).json(result.body);
}
