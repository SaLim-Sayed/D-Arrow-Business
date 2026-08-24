import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

import { ZatcaError } from "./zatca/errors";
import {
  requestComplianceCsidHandler,
  requestProductionCsidHandler,
  saveOnboardingSecrets,
  submitInvoiceHandler,
} from "./zatca/handlers";

admin.initializeApp();
const db = admin.firestore();

function requireAuth(request: { auth?: { uid: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return uid;
}

function rethrow(err: unknown): never {
  if (err instanceof ZatcaError) {
    throw new HttpsError(
      err.code as
        | "unauthenticated"
        | "permission-denied"
        | "invalid-argument"
        | "failed-precondition"
        | "not-found"
        | "aborted",
      err.message
    );
  }
  throw err;
}

/**
 * Optional Cloud Functions entry points (requires Firebase Blaze).
 * Production traffic uses Vercel `/api/zatca/*` instead — see docs/zatca-phase2-setup.md.
 */

export const zatcaSaveOnboardingSecrets = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    return await saveOnboardingSecrets(db, uid, request.data ?? {});
  } catch (err) {
    rethrow(err);
  }
});

export const zatcaRequestComplianceCsid = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    return await requestComplianceCsidHandler(db, uid, request.data ?? {});
  } catch (err) {
    rethrow(err);
  }
});

export const zatcaRequestProductionCsid = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    return await requestProductionCsidHandler(db, uid, request.data ?? {});
  } catch (err) {
    rethrow(err);
  }
});

export const zatcaSubmitInvoice = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    return await submitInvoiceHandler(db, uid, request.data ?? {});
  } catch (err) {
    rethrow(err);
  }
});
