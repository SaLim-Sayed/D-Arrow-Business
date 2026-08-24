/**
 * Atomically allocates the next ICV (Invoice Counter Value) and hands back
 * the PIH (previous invoice hash) a new invoice must reference. The chain is
 * per-company and covers ALL Phase-2-submitted invoices in issuance order —
 * gaps or reordering break ZATCA's hash-chain validation for every invoice
 * after the break, so this MUST run inside a Firestore transaction (two
 * invoices submitted at the same moment must not get the same ICV).
 */

import * as admin from "firebase-admin";
import { ZATCA_GENESIS_PIH } from "./config";

export interface ZatcaChainState {
  icv: number;
  lastInvoiceHash: string;
  updatedAt: FirebaseFirestore.FieldValue;
}

const chainDocPath = (companyId: string) =>
  `companies/${companyId}/zatcaChain/state`;

/**
 * Reserves the next ICV inside `txn`. Call BEFORE building the invoice XML
 * (the ICV/PIH are embedded in the XML itself), then call
 * `commitChainAdvance` with the *signed* invoice's hash once signing
 * succeeds. If anything fails after reserving but before commit, the
 * transaction as a whole rolls back — Firestore transactions guarantee the
 * reservation doesn't stick around half-done.
 */
export async function reserveNextChainStep(
  db: FirebaseFirestore.Firestore,
  txn: FirebaseFirestore.Transaction,
  companyId: string
): Promise<{ icv: number; previousInvoiceHash: string }> {
  const ref = db.doc(chainDocPath(companyId));
  const snap = await txn.get(ref);
  if (!snap.exists) {
    return { icv: 1, previousInvoiceHash: ZATCA_GENESIS_PIH };
  }
  const data = snap.data() as { icv?: number; lastInvoiceHash?: string } | undefined;
  const currentIcv = typeof data?.icv === "number" ? data.icv : 0;
  const lastHash = data?.lastInvoiceHash || ZATCA_GENESIS_PIH;
  return { icv: currentIcv + 1, previousInvoiceHash: lastHash };
}

/** Advances the chain state within the SAME transaction, after signing succeeded. */
export function commitChainAdvance(
  db: FirebaseFirestore.Firestore,
  txn: FirebaseFirestore.Transaction,
  companyId: string,
  icv: number,
  newInvoiceHash: string
): void {
  const ref = db.doc(chainDocPath(companyId));
  txn.set(
    ref,
    {
      icv,
      lastInvoiceHash: newInvoiceHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
