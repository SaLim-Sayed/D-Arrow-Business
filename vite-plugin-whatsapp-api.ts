import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { getWhatsAppStatus, sendWhatsAppMessage } from "./api/whatsapp/lib";

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function whatsappApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "whatsapp-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0];

        if (pathname === "/api/whatsapp/status" && req.method === "GET") {
          const result = getWhatsAppStatus(env);
          sendJson(res, result.status, result.body);
          return;
        }

        if (pathname === "/api/whatsapp/send" && req.method === "POST") {
          try {
            const body = (await readJsonBody(req)) as { to?: string; body?: string };
            const result = await sendWhatsAppMessage(env, body);
            sendJson(res, result.status, result.body);
          } catch {
            sendJson(res, 500, { error: "Failed to process WhatsApp send request" });
          }
          return;
        }

        next();
      });
    },
  };
}
