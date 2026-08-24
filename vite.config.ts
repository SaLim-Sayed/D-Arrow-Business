import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { IncomingMessage, ServerResponse } from "node:http";

function zatcaApiDevPlugin() {
  return {
    name: "zatca-api-dev",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/api/zatca/")) {
          next();
          return;
        }
        try {
          const mod = await server.ssrLoadModule("/api/_lib/handle-zatca-http.ts");
          await mod.dispatchZatcaApi(req, res, url);
        } catch (err) {
          console.error("[zatca-dev]", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "ZATCA API failed",
              })
            );
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), zatcaApiDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    external: ["firebase-admin", "xml-crypto", "xmldom", "axios"],
  },
  optimizeDeps: {
    exclude: ["firebase-admin", "xml-crypto", "xmldom"],
  },
});
