# ZATCA Phase 2 setup

This app now has a Phase 2 (integration phase) e-invoicing pipeline in
addition to the Phase 1 QR code that already existed:

- `src/features/billing/` — data model (`schemas/zatca.ts`, `zatca*` fields
  on `Invoice`/`BillingSettings`), the client HTTP wrapper
  (`api/zatca.service.ts`), the "Submit to ZATCA" button and status chip on
  `InvoiceDetailPage`, and the ZATCA/Advanced settings section.
- `functions/src/zatca/` — shared library that builds the ZATCA UBL XML,
  applies the cryptographic stamp (XAdES-BES), maintains the invoice hash
  chain (ICV/PIH), and calls ZATCA's Clearance/Reporting API.
- `api/zatca/` — Vercel serverless routes that run that library (no Firebase
  Blaze plan required). Optional Cloud Functions wrappers remain in
  `functions/src/index.ts` if you later upgrade the Firebase project.

**Nothing here submits real invoices until you complete ZATCA onboarding**
(below) and enable it in Settings → Advanced. Until then, invoices keep
working exactly as before with the Phase 1 QR.

## Why a server function at all?

The cryptographic stamp requires a private key. That key must never reach
the browser — anyone with it could forge invoices in your name. So signing
and the hash-chain bookkeeping run server-side (`/api/zatca` on Vercel),
using Firestore transactions to keep the ICV/PIH chain gap-free even if two
invoices are submitted at the same moment.

## 1. Onboard with ZATCA (one-time per environment)

You need a **Compliance CSID** (then a **Production CSID**) issued by ZATCA
via the Fatoora portal. Recommended path — use ZATCA's own tooling, not this
repo's `functions/scripts/onboard.ts` (that script is a bare-bones fallback
and uses a placeholder RSA key where ZATCA actually requires secp256k1 —
see the comments in that file):

1. Download the **Compliance & Enablement Toolbox** SDK:
   https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/ComplianceEnablementToolbox/Pages/DownloadSDK.aspx
2. Follow the SDK's onboarding flow to generate a CSR and get a one-time
   password (OTP) from the Fatoora portal for the environment you're
   targeting (Simulation first, then Production).
3. In this app, an admin POSTs to `/api/zatca/compliance-csid` with
   `{ companyId, environment, csrBase64, otp }` (Firebase ID token in
   `Authorization: Bearer …`) — this exchanges the CSR + OTP for a
   compliance CSID and stores the resulting auth
   (`binarySecurityToken`/`secret`) in
   `companies/{companyId}/zatcaSecrets/{environment}` (a Firestore path
   blocked from all client SDKs — see `firestore.rules`).
4. Separately, save the private key / public key / certificate the SDK gave
   you via POST `/api/zatca/save-secrets` (same Firestore doc).
5. Call POST `/api/zatca/production-csid` to exchange the compliance CSID for
   a production CSID once you're ready to leave Simulation.
6. In the app's Settings → Advanced tab, flip "Enable ZATCA Phase 2
   submission" and pick the matching environment. (This screen only ever
   reads/writes the non-secret `enabled`/`environment`/`onboarded` flags —
   never the key material.)

Why this isn't a click-a-button UI flow: CSID issuance is a real
credential-issuing action tied to your VAT registration. Keeping it to a
deliberate, admin-run call (not a stray button click) is intentional.

## 2. Deploy on Vercel (no Firebase Blaze plan)

The frontend already deploys to Vercel. The ZATCA routes live at:

- `POST /api/zatca/submit`
- `POST /api/zatca/compliance-csid`
- `POST /api/zatca/production-csid`
- `POST /api/zatca/save-secrets`

### Service account (required)

The API uses the Firebase Admin SDK, which bypasses Firestore rules. Create a
service account in Google Cloud / Firebase:

1. Firebase console → Project settings → Service accounts →
   **Generate new private key**.
2. In Vercel → Project → Settings → Environment Variables, add **one** of:

   - `FIREBASE_SERVICE_ACCOUNT` — the JSON file contents as a single line, or
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` — `base64` of that JSON (easier with
     the `private_key` newlines).

   Scope it to Production (and Preview if you test ZATCA on preview deploys).

3. Redeploy the Vercel project after saving the env var.

Hobby-plan functions time out at 10 seconds. If ZATCA is slow to respond,
upgrade the Vercel project to Pro (or raise `maxDuration` in `vercel.json`).

For local `npm run dev`, put the same variable in `.env.local` (gitignored
via `*.local`). Vite's middleware then serves `/api/zatca/*` on the Vite
dev server.

Spark/Blaze note: **do not** run `firebase deploy --only functions` unless
the Firebase project is on Blaze. Cloud Functions are optional now.

## 3. Validate before trusting it

Before flipping any company to the `core` (production) environment:

1. Submit a handful of test invoices with `environment: "simulation"` and
   confirm ZATCA's response is `CLEARED`/`REPORTED`, not `REJECTED`.
2. Take the generated XML (log it, or add a temporary debug field) and run
   it through ZATCA's **Web-Based Validator** / SDK compliance check —
   linked from the same Compliance Enablement Toolbox page above.
3. Specifically re-check `functions/src/zatca/sign.ts` — it's flagged
   `HIGHEST-RISK MODULE` in its own header comment. The XAdES-BES signature
   structure there follows the common pattern used by other open-source
   ZATCA integrations, but hasn't been validated against a live ZATCA
   endpoint from inside this codebase. If ZATCA rejects the signature,
   diff this file against:
   - https://github.com/wes4m/zatca-xml-js (TypeScript)
   - https://github.com/mabaega/ZatcaPython (Python)
   - https://github.com/mabaega/ZatcaPHP (PHP)
4. Also re-check `ZATCA_GENESIS_PIH` in `functions/src/zatca/config.ts` —
   it's the seed hash for a company's very first invoice, reproduced from a
   third-party write-up rather than a ZATCA PDF we could machine-verify.
   If your first invoice's PIH check fails, this constant is the first
   thing to check.

## Scope / what's NOT covered yet

- **Credit/debit notes.** This pipeline covers standard invoices
  (`Invoice` documents). Credit/debit notes go through a separate
  `generic-document` schema in this app — extending `xmlBuilder.ts` /
  `mapping.ts` to handle them (different `InvoiceTypeCode` value, 383/381
  instead of 388) is a follow-up.
- **Zero-rated / exempt line items.** `xmlBuilder.ts` emits a placeholder
  `TaxExemptionReasonCode` (`VATEX-SA-OOS`) for any 0% line — wire the
  correct code for your actual exemption category before relying on it.
- **Foreign-currency invoices.** The XML builder assumes invoice currency
  == tax currency (true for SAR-only invoices, which is this app's default).
  Multi-currency KSA invoicing needs an extra currency-converted TaxTotal
  block ZATCA's schematron may require — not implemented.

## Sources used while building this

- ZATCA "Electronic Invoice XML Implementation Standard" —
  https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20220624_ZATCA_Electronic_Invoice_XML_Implementation_Standard_vF.pdf
- ZATCA "Electronic Invoice Security Features Implementation Standards" (QR
  tag table) —
  https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf
- ZATCA "Detailed Guidelines for E-Invoicing" —
  https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-Invoicing_Detailed__Guideline.pdf
- Fatoora Developer Community — "E-Invoicing API endpoints" —
  https://zatca1.discourse.group/t/e-invoicing-api-endpoints/487
- Jibrid, "ZATCA Phase 2 API Integration Guide for Developers" —
  https://www.jibrid.com/blog/zatca-phase2-api-integration-guide
- wes4m/zatca-xml-js (reference implementation) —
  https://github.com/wes4m/zatca-xml-js
