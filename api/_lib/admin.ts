import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function parseJsonEnv(): Record<string, string> | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<string, string>;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  return JSON.parse(raw) as Record<string, string>;
}

function loadServiceAccount(): ServiceAccount | null {
  const rec = parseJsonEnv();
  if (!rec) return null;
  return {
    projectId: rec.project_id ?? rec.projectId,
    clientEmail: rec.client_email ?? rec.clientEmail,
    privateKey: rec.private_key ?? rec.privateKey,
  };
}

/** Initializes Admin SDK once (Vercel / Vite middleware). Cloud Functions still call initializeApp() themselves. */
export function getAdminDb(): Firestore {
  if (!getApps().length) {
    const account = loadServiceAccount();
    if (account?.projectId && account.clientEmail && account.privateKey) {
      initializeApp({
        credential: cert(account),
        projectId: account.projectId,
      });
    } else {
      try {
        initializeApp();
      } catch {
        throw new Error(
          "Missing FIREBASE_SERVICE_ACCOUNT (or FIREBASE_SERVICE_ACCOUNT_BASE64). Add a Firebase service account JSON as a Vercel env var — see docs/zatca-phase2-setup.md."
        );
      }
    }
  }
  return getFirestore();
}
