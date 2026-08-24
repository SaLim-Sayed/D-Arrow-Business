/**
 * ⚠️ HIGHEST-RISK MODULE — READ BEFORE ENABLING PRODUCTION SUBMISSION ⚠️
 *
 * This builds the XAdES-BES cryptographic stamp ZATCA requires inside
 * ext:UBLExtensions, and computes the invoice hash used for the QR (tag 6)
 * and as the next invoice's PIH. The overall recipe (canonicalize -> SHA-256
 * -> ECDSA-sign the digest -> embed signature+cert+pubkey) is confirmed
 * against ZATCA's own documentation and multiple independent integrations
 * (see docs/zatca-phase2-setup.md for sources). The exact byte-level
 * XAdES XML structure below follows the common pattern used by those
 * integrations, but — unlike the QR tags and XML field layout — it has NOT
 * been validated against a live ZATCA endpoint from this codebase.
 *
 * Before trusting this in production:
 *   1. Run a sample invoice through ZATCA's Web-Based Validator or SDK
 *      (Compliance Enablement Toolbox) and confirm it accepts the signature.
 *   2. If it's rejected, compare this file against the reference
 *      implementation at https://github.com/wes4m/zatca-xml-js (TypeScript,
 *      MIT-style) or https://github.com/mabaega/ZatcaPython — both are
 *      independent open-source integrations you can diff against.
 *   3. Only then flip a company's zatcaPhase2.environment to "core".
 */

import { createSign } from "crypto";
import { DOMParser } from "xmldom";
// @ts-ignore - xml-crypto ships its own types but the exclusive-c14n canonicalizer
// is easiest to reach via this internal export across versions; see setup docs.
import * as xmlCrypto from "xml-crypto";
import { sha256Base64 } from "./hash";
import { buildPhase2Qr } from "./qr";

export interface ZatcaSigningKeys {
  /** PEM-encoded EC (secp256k1) private key issued/derived alongside your ZATCA CSID. */
  privateKeyPem: string;
  /** PEM-encoded EC public key matching privateKeyPem. */
  publicKeyPem: string;
  /** Base64 DER X.509 certificate — the CSID ZATCA issued you (compliance or production). */
  certificateBase64: string;
  /**
   * Base64 signature ZATCA's technical CA produced over your certificate at
   * CSID issuance time (returned alongside the CSID) — used for QR tag 9 on
   * simplified invoices. Optional: omit for standard/cleared invoices.
   */
  certSignatureBase64?: string;
}

function canonicalizeExclusiveC14n(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Canonicalizer = (xmlCrypto as any).ExclusiveCanonicalization;
  const canonicalizer = new Canonicalizer();
  return canonicalizer.process(doc.documentElement, {});
}

/** Removes the ext:UBLExtensions element (and its placeholder comment) before hashing, per ZATCA's algorithm. */
function stripUblExtensions(xml: string): string {
  return xml.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>\s*/, "");
}

export interface SignResult {
  signedXml: string;
  invoiceHashBase64: string;
  qrBase64: string;
}

export function signInvoiceXml(
  unsignedXml: string,
  keys: ZatcaSigningKeys,
  qrHeader: {
    sellerName: string;
    vatNumber: string;
    timestampIso: string;
    invoiceTotal: number;
    vatTotal: number;
  }
): SignResult {
  // 1. Invoice hash = SHA-256 of the exclusively-canonicalized document, with
  //    ext:UBLExtensions removed (it doesn't exist yet in any meaningful form
  //    at this point anyway).
  const hashableXml = canonicalizeExclusiveC14n(stripUblExtensions(unsignedXml));
  const invoiceHashBase64 = sha256Base64(hashableXml);

  // 2. ECDSA-SHA256-sign the canonicalized XML. createSign("SHA256") hashes
  //    its input internally with SHA-256 before the raw ECDSA operation, so
  //    signing `hashableXml` here (not a pre-hashed digest) is what produces
  //    a signature over the same SHA-256 digest as invoiceHashBase64 above —
  //    feeding an already-hashed value in here would double-hash it, which
  //    is wrong.
  const signer = createSign("SHA256");
  signer.update(hashableXml, "utf8");
  signer.end();
  const signatureDer = signer.sign(keys.privateKeyPem);
  const ecdsaSignatureBase64 = signatureDer.toString("base64");

  // Public key as raw base64 (strip PEM armor).
  const ecdsaPublicKeyBase64 = keys.publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");

  // 3. Build the Phase-2 QR (tags 1-9).
  const qrBase64 = buildPhase2Qr({
    sellerName: qrHeader.sellerName,
    vatNumber: qrHeader.vatNumber,
    timestampIso: qrHeader.timestampIso,
    invoiceTotal: qrHeader.invoiceTotal,
    vatTotal: qrHeader.vatTotal,
    invoiceHashBase64,
    ecdsaSignatureBase64,
    ecdsaPublicKeyBase64,
    certSignatureBase64: keys.certSignatureBase64,
  });

  // 4. XAdES-BES signature block embedded in ext:UBLExtensions.
  const signingTime = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const certDigest = sha256Base64(Buffer.from(keys.certificateBase64, "base64"));

  const extensionContent = `<sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
  <sac:SignatureInformation>
    <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">urn:oasis:names:specification:ubl:signature:1</cbc:ID>
    <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
        <ds:Reference URI="">
          <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          </ds:Transforms>
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${invoiceHashBase64}</ds:DigestValue>
        </ds:Reference>
      </ds:SignedInfo>
      <ds:SignatureValue>${ecdsaSignatureBase64}</ds:SignatureValue>
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>${keys.certificateBase64}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <ds:Object>
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature">
          <xades:SignedProperties Id="xadesSignedProperties">
            <xades:SignedSignatureProperties>
              <xades:SigningTime>${signingTime}</xades:SigningTime>
              <xades:SigningCertificate>
                <xades:Cert>
                  <xades:CertDigest>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue>${certDigest}</ds:DigestValue>
                  </xades:CertDigest>
                </xades:Cert>
              </xades:SigningCertificate>
            </xades:SignedSignatureProperties>
          </xades:SignedProperties>
        </xades:QualifyingProperties>
      </ds:Object>
    </ds:Signature>
  </sac:SignatureInformation>
</sig:UBLDocumentSignatures>`;

  let signedXml = unsignedXml.replace("<!-- SIGNATURE_PLACEHOLDER -->", extensionContent.replace(/\$/g, "$$$$"));
  signedXml = signedXml.replace("<!-- QR_PLACEHOLDER -->", qrBase64);

  return { signedXml, invoiceHashBase64, qrBase64 };
}
