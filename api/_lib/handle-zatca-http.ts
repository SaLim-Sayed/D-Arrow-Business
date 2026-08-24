import type { IncomingMessage, ServerResponse } from "node:http";
import { getAuth } from "firebase-admin/auth";
import { ZatcaError, unauthenticated } from "../../functions/src/zatca/errors";
import {
  requestComplianceCsidHandler,
  requestProductionCsidHandler,
  saveOnboardingSecrets,
  submitInvoiceHandler,
} from "../../functions/src/zatca/handlers";
import { getAdminDb } from "./admin";

export type ZatcaAction = "submit" | "compliance-csid" | "production-csid" | "save-secrets";

const ACTIONS = new Set<ZatcaAction>(["submit", "compliance-csid", "production-csid", "save-secrets"]);

export function actionFromUrl(url: string): ZatcaAction | null {
  const path = url.split("?")[0] ?? "";
  const part = path.replace(/^\/api\/zatca\/?/, "").split("/")[0] ?? "";
  return ACTIONS.has(part as ZatcaAction) ? (part as ZatcaAction) : null;
}

type BodyReq = IncomingMessage & { body?: unknown };

async function readJsonBody(req: BodyReq): Promise<unknown> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      return req.body ? JSON.parse(req.body) : {};
    }
    return req.body;
  }
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function dispatchZatcaApi(req: IncomingMessage, res: ServerResponse, url: string): Promise<void> {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const action = actionFromUrl(url);
  if (!action) {
    sendJson(res, 404, { error: "Unknown ZATCA action" });
    return;
  }

  try {
    const db = getAdminDb();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthenticated();
    }
    const decoded = await getAuth().verifyIdToken(header.slice("Bearer ".length));
    const data = await readJsonBody(req);

    let result: unknown;
    switch (action) {
      case "submit":
        result = await submitInvoiceHandler(db, decoded.uid, data);
        break;
      case "compliance-csid":
        result = await requestComplianceCsidHandler(db, decoded.uid, data);
        break;
      case "production-csid":
        result = await requestProductionCsidHandler(db, decoded.uid, data);
        break;
      case "save-secrets":
        result = await saveOnboardingSecrets(db, decoded.uid, data);
        break;
    }
    sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof ZatcaError) {
      sendJson(res, err.status, { error: err.message, code: err.code });
      return;
    }
    console.error("[zatca]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    sendJson(res, 500, { error: message });
  }
}
