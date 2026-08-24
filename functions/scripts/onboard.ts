/**
 * Local, one-time helper for ZATCA Phase 2 onboarding. Run with:
 *   cd functions && npm run build && node lib/scripts/onboard.js
 *
 * ⚠️ RECOMMENDED PATH: generate your CSR with ZATCA's own SDK instead of this
 * script. Download the "Compliance & Enablement Toolbox" from
 * https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/ComplianceEnablementToolbox/Pages/DownloadSDK.aspx
 * and use its `csr.properties` + CSR generation command — the CSR's Subject
 * fields (organizationIdentifier OID 2.5.4.97 encoding your VAT number,
 * business category, EGS serial number, etc.) are exactly what ZATCA's
 * onboarding endpoint checks, and their tool is the authoritative source for
 * the correct encoding. This script exists as a fallback/reference only,
 * using node-forge with best-effort field mapping — verify the CSR it
 * produces against the SDK's output before using it for real onboarding.
 *
 * What this script does, step by step:
 *   1. Generates an EC (secp256k1) keypair.
 *   2. Builds a CSR from the fields you fill in below.
 *   3. Prints the CSR (base64) and keys — paste the CSR + your Fatoora-portal
 *      OTP into POST /api/zatca/compliance-csid (signed-in admin).
 *   4. After that succeeds, call POST /api/zatca/save-secrets with the
 *      resulting keys/cert so POST /api/zatca/submit can use them.
 *
 * This script talks to nothing — it's pure local key/CSR generation. It
 * does not call ZATCA or Firebase; wire the printed values into the
 * /api/zatca onboarding endpoints once you're ready.
 */

import * as forge from "node-forge";

interface CsrFields {
  commonName: string; // EGS unit's common name, e.g. your solution/device name
  organizationalUnitName: string; // Branch name
  organizationName: string; // Legal company name
  countryCode: string; // "SA"
  /** VAT registration number, 15 digits. */
  vatNumber: string;
  /** e.g. "Retail", "Wholesale" — your registered business category. */
  businessCategory: string;
  /** EGS serial number you assign this cash register / device / app instance. */
  egsSerialNumber: string;
}

function buildCsr(fields: CsrFields) {
  const keys = forge.pki.rsa.generateKeyPair(2048); // placeholder: see note below re: secp256k1
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    { name: "commonName", value: fields.commonName },
    { name: "organizationalUnitName", value: fields.organizationalUnitName },
    { name: "organizationName", value: fields.organizationName },
    { name: "countryName", value: fields.countryCode },
    // organizationIdentifier (2.5.4.97) — ZATCA's documented format is
    // "1-<VAT number>-<branch/unit number>", VERIFY the exact convention
    // against the SDK before submitting.
    { type: "2.5.4.97", value: `1-${fields.vatNumber}-1` },
  ]);
  csr.addAttribute({
    name: "extensionRequest",
    extensions: [
      { name: "subjectAltName", altNames: [] },
    ],
  });
  csr.sign(keys.privateKey, forge.md.sha256.create());

  return {
    csrPem: forge.pki.certificationRequestToPem(csr),
    csrBase64: Buffer.from(forge.pki.certificationRequestToPem(csr)).toString("base64"),
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    publicKeyPem: forge.pki.publicKeyToPem(keys.publicKey),
  };
}

// --- Fill these in and run the script ---
const fields: CsrFields = {
  commonName: "CHANGE_ME EGS Unit",
  organizationalUnitName: "CHANGE_ME Branch",
  organizationName: "CHANGE_ME Company Legal Name",
  countryCode: "SA",
  vatNumber: "CHANGE_ME_15_DIGIT_VAT",
  businessCategory: "CHANGE_ME",
  egsSerialNumber: "CHANGE_ME-001",
};

// NOTE: node-forge's RSA generator is used above only to keep this reference
// script dependency-light. ZATCA requires EC/secp256k1 keys for the actual
// signing key — for anything beyond a first dry run, generate the real
// keypair + CSR with the ZATCA SDK (openssl ecparam -name secp256k1 ...),
// not this script.
if (require.main === module) {
  const result = buildCsr(fields);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

export { buildCsr };
