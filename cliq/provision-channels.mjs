#!/usr/bin/env node
/**
 * Creates the Zoho Cliq channel structure from docs/Zoho-Cliq-Implementation-Plan.md (§3).
 * Implements Phase 2 — Channel Setup.
 *
 * Usage:
 *   node cliq/provision-channels.mjs                    # dry run, full structure
 *   node cliq/provision-channels.mjs --set minimal      # dry run, trimmed starter set
 *   node cliq/provision-channels.mjs --apply            # actually create them
 *
 * Environment:
 *   CLIQ_OAUTH_TOKEN  Zoho OAuth token with ZohoCliq.Channels.CREATE scope (required for --apply)
 *   CLIQ_API_BASE     Override API host for non-.com data centres
 *                     (e.g. https://cliq.zoho.sa for Saudi Arabia). Defaults to https://cliq.zoho.com
 *
 * Dry run is the default on purpose: this creates real channels in a live org,
 * and an accidental full run leaves 19 of them to clean up by hand.
 */
const CHANNELS = [
  // [unique_name, display name, level, description, sets]
  ["general", "General", "organization", "General company communication.", ["minimal", "full"]],
  ["announcements", "Announcements", "organization", "Official company announcements. Posting restricted.", ["minimal", "full"]],
  ["random", "Random", "organization", "Casual, non-project discussion.", ["full"]],

  ["management", "Management", "team", "Management coordination.", ["full"]],
  ["management-private", "Management Private", "private", "Sensitive management discussion.", ["full"]],

  ["development", "Development", "team", "Engineering discussion, architecture, technical decisions.", ["minimal", "full"]],
  ["frontend", "Frontend", "team", "UI, performance, component and frontend bug discussion.", ["full"]],
  ["backend", "Backend", "team", "APIs, database, auth, backend architecture.", ["full"]],
  ["mobile", "Mobile", "team", "Mobile releases and bugs.", ["full"]],
  ["qa", "QA", "team", "Testing, regression, release validation.", ["full"]],
  ["devops", "DevOps", "team", "CI/CD, infrastructure, monitoring, production issues.", ["minimal", "full"]],

  ["sales", "Sales", "team", "Sales updates, leads, customer discussion.", ["full"]],
  ["marketing", "Marketing", "team", "Campaigns and content.", ["full"]],
  // Private from creation — retrofitting privacy means auditing history, not flipping a setting.
  ["finance", "Finance", "private", "Invoices, payments, financial operations.", ["full"]],
  ["hr", "HR", "private", "Employee updates, policies, HR discussion.", ["full"]],

  ["project-d-arrow", "Project D-Arrow", "team", "D-Arrow project updates, blockers, releases.", ["full"]],
  ["project-riwaya", "Project Riwaya", "team", "Riwaya project updates, blockers, releases.", ["full"]],
  ["project-mobile", "Project Mobile", "team", "Mobile project updates, blockers, releases.", ["full"]],

  ["deployments", "Deployments", "organization", "Automated deployment notifications.", ["minimal", "full"]],
  ["alerts", "Alerts", "organization", "Automated production alerts.", ["minimal", "full"]],
  ["integrations", "Integrations", "organization", "Integration health and configuration notices.", ["full"]],
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const set = args.set ?? "full";

if (!["minimal", "full"].includes(set)) {
  console.error(`Unknown --set "${set}". Expected: minimal, full`);
  process.exit(1);
}

const apiBase = (process.env.CLIQ_API_BASE ?? "https://cliq.zoho.com").replace(/\/$/, "");
const selected = CHANNELS.filter(([, , , , sets]) => sets.includes(set));

console.log(`Channel set: ${set} — ${selected.length} channel(s)\n`);

for (const [unique, name, level, description] of selected) {
  const privacy = level === "private" ? "  [private]" : "";
  console.log(`  #${unique.padEnd(20)} ${level.padEnd(14)} ${name}${privacy}`);
}
console.log("");

if (!args.apply) {
  console.log("Dry run. Nothing was created. Re-run with --apply to create these channels.");
  process.exit(0);
}

const token = process.env.CLIQ_OAUTH_TOKEN;

if (!token) {
  console.error("CLIQ_OAUTH_TOKEN is not set. Generate one with the ZohoCliq.Channels.CREATE scope.");
  process.exit(1);
}

let created = 0;
let skipped = 0;
let failed = 0;

for (const [unique, name, level, description] of selected) {
  try {
    const response = await fetch(`${apiBase}/api/v2/channels`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, unique_name: unique, level, description }),
    });

    const body = await response.text();

    if (response.ok) {
      created += 1;
      console.log(`created  #${unique}`);
    } else if (response.status === 400 && /exist/i.test(body)) {
      // Re-running after a partial failure should be safe.
      skipped += 1;
      console.log(`exists   #${unique}`);
    } else {
      failed += 1;
      console.error(`FAILED   #${unique} — ${response.status} ${body.slice(0, 200)}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`FAILED   #${unique} — ${error.message}`);
  }
}

console.log(`\ncreated ${created}, already existed ${skipped}, failed ${failed}`);
process.exit(failed > 0 ? 1 : 0);
