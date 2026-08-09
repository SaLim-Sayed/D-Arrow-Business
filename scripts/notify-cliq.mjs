#!/usr/bin/env node
/**
 * Posts a deployment notification to Zoho Cliq via incoming webhook.
 * Implements the message formats in docs/Zoho-Cliq-Implementation-Plan.md (§15).
 *
 * Usage:
 *   node scripts/notify-cliq.mjs --status started  --env production --commit abc123 --actor Salem
 *   node scripts/notify-cliq.mjs --status success  --env production --duration 2m15s
 *   node scripts/notify-cliq.mjs --status failure  --env production --reason "Build failed"
 *   node scripts/notify-cliq.mjs --status rollback --env production --reason "Checkout errors"
 *
 * Environment:
 *   CLIQ_WEBHOOK_DEPLOYMENTS  Incoming-webhook URL for #deployments (required)
 *   CLIQ_WEBHOOK_DEVOPS       Incoming-webhook URL for #devops (optional; gets failures/rollbacks too)
 *
 * Notification failures never break the pipeline unless --strict is passed.
 */
const STATUSES = {
  started: { emoji: "🚀", title: "Deployment Started", theme: "modern-inline" },
  success: { emoji: "✅", title: "Deployment Successful", theme: "modern-inline" },
  failure: { emoji: "❌", title: "Deployment Failed", theme: "prompt" },
  rollback: { emoji: "⏪", title: "Deployment Rolled Back", theme: "prompt" },
};

/** Statuses that are high priority per plan §19 and also go to #devops. */
const ESCALATED = new Set(["failure", "rollback"]);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const status = args.status;

if (!status || !STATUSES[status]) {
  console.error(
    `Missing or unknown --status. Expected one of: ${Object.keys(STATUSES).join(", ")}`
  );
  process.exit(1);
}

const { emoji, title, theme } = STATUSES[status];

const project = args.project ?? "D-Arrow Business";
const environment = args.env ?? "production";
const branch = args.branch ?? process.env.GITHUB_REF_NAME ?? "main";
const commit = (args.commit ?? process.env.GITHUB_SHA ?? "").slice(0, 7);
const actor = args.actor ?? process.env.GITHUB_ACTOR ?? "unknown";
const runUrl =
  args.url ??
  (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null);

/** Rows are ordered to match the plan's example payloads. */
const rows = [
  ["Project", project],
  ["Environment", environment],
  ["Branch", branch],
  ["Commit", commit || "—"],
  ["Triggered By", actor],
];

if (args.duration) rows.push(["Duration", String(args.duration)]);
if (args.reason) rows.push(["Reason", String(args.reason)]);

const message = {
  text: `${emoji} *${title}* — ${project} (${environment})`,
  bot: { name: "Deployment Bot" },
  card: { title: `${emoji} ${title}`, theme },
  slides: [
    {
      type: "table",
      data: {
        headers: ["Field", "Value"],
        rows: rows.map(([field, value]) => ({ Field: field, Value: String(value) })),
      },
    },
  ],
};

if (runUrl) {
  message.buttons = [
    { label: "View run", action: { type: "open.url", data: { web: runUrl } } },
  ];
}

const targets = [["#deployments", process.env.CLIQ_WEBHOOK_DEPLOYMENTS]];

if (ESCALATED.has(status) && process.env.CLIQ_WEBHOOK_DEVOPS) {
  targets.push(["#devops", process.env.CLIQ_WEBHOOK_DEVOPS]);
}

const configured = targets.filter(([, url]) => Boolean(url));

if (configured.length === 0) {
  console.error("No Cliq webhook configured (set CLIQ_WEBHOOK_DEPLOYMENTS). Skipping.");
  process.exit(args.strict ? 1 : 0);
}

let failed = false;

for (const [channel, url] of configured) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      failed = true;
      console.error(
        `Cliq ${channel} responded ${response.status}: ${(await response.text()).slice(0, 300)}`
      );
    } else {
      console.log(`Notified ${channel}: ${title}`);
    }
  } catch (error) {
    failed = true;
    console.error(`Cliq ${channel} request failed: ${error.message}`);
  }
}

process.exit(failed && args.strict ? 1 : 0);
