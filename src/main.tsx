import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ENABLE_MOCKS } from "./lib/constants";
import "./lib/i18n";
import "./styles/globals.css";

async function bootstrap() {
  if (ENABLE_MOCKS) {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
