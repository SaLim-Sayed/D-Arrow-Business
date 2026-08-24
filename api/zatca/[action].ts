import type { IncomingMessage, ServerResponse } from "node:http";
import { dispatchZatcaApi } from "../_lib/handle-zatca-http";

type VercelReq = IncomingMessage & { query?: { action?: string | string[] } };

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelReq, res: ServerResponse): Promise<void> {
  const raw = req.query?.action;
  const action = Array.isArray(raw) ? raw[0] : raw;
  const url = `/api/zatca/${action ?? ""}`;
  await dispatchZatcaApi(req, res, url);
}
