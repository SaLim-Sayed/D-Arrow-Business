import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getWhatsAppStatus } from "./lib";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const result = getWhatsAppStatus(process.env);
  return res.status(result.status).json(result.body);
}
