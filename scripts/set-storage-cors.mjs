#!/usr/bin/env node
/**
 * Verify / apply CORS on the Firebase Storage bucket.
 *
 * Usage: node scripts/set-storage-cors.mjs
 *
 * Prerequisites:
 * 1. Firebase project on Blaze (billing enabled)
 * 2. Default Storage bucket created in Console → Storage → Get started
 * 3. Logged in: npx firebase-tools login
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const projectId = "d-arrow-buisiness";
const bucket = `${projectId}.firebasestorage.app`;
const cors = JSON.parse(readFileSync(join(root, "storage.cors.json"), "utf8"));

const toolsPath = join(homedir(), ".config/configstore/firebase-tools.json");
const tools = JSON.parse(readFileSync(toolsPath, "utf8"));
const accessToken = tools?.tokens?.access_token;
if (!accessToken) {
  console.error("No Firebase CLI access token. Run: npx firebase-tools login");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${accessToken}` };

const billingRes = await fetch(
  `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`,
  { headers: auth },
);
const billing = await billingRes.json();
if (!billing.billingEnabled) {
  console.error(`
Billing is OFF for project "${projectId}".

Cloud Storage for Firebase needs the Blaze plan to create the default bucket
(${bucket}).

1. Open https://console.firebase.google.com/project/${projectId}/usage/details
2. Upgrade to Blaze (pay-as-you-go; free tier still applies)
3. Open Storage → Get started → create the default bucket
4. Re-run: node scripts/set-storage-cors.mjs
`);
  process.exit(1);
}

const probe = await fetch(
  `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}?fields=name,cors`,
  { headers: auth },
);

if (probe.status === 404) {
  console.error(`
Bucket gs://${bucket} does not exist yet.

1. Open https://console.firebase.google.com/project/${projectId}/storage
2. Click Get started and create the default bucket (prefer us-central1)
3. Deploy rules: npx firebase-tools deploy --only storage
4. Re-run: node scripts/set-storage-cors.mjs
`);
  process.exit(1);
}

if (!probe.ok) {
  console.error(`Could not read bucket (${probe.status}): ${(await probe.text()).slice(0, 400)}`);
  process.exit(1);
}

const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}`;
const res = await fetch(url, {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ cors }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Failed to set CORS (${res.status}): ${text.slice(0, 500)}`);
  process.exit(1);
}

const get = await fetch(`${url}?fields=cors`, { headers: auth });
const verified = await get.json();
console.log(`CORS applied to gs://${bucket}`);
console.log(JSON.stringify(verified.cors ?? verified, null, 2));
