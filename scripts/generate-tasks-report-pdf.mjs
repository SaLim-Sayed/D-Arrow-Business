#!/usr/bin/env node
/**
 * Generates docs/المهام-تقرير-9-يوليو-2026.pdf from the HTML report.
 * Usage: node scripts/generate-tasks-report-pdf.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "docs", "المهام-تقرير-9-يوليو-2026.html");
const pdfPath = path.join(root, "docs", "المهام-تقرير-9-يوليو-2026.pdf");

const chromePaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const chrome = chromePaths.find((p) => fs.existsSync(p));

if (!chrome) {
  console.error(
    "Chrome/Chromium not found. Open docs/المهام-تقرير-9-يوليو-2026.html in a browser and use Print → Save as PDF."
  );
  process.exit(1);
}

const result = spawnSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`PDF created: ${pdfPath}`);
