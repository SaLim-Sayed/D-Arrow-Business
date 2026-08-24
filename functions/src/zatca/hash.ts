import { createHash } from "crypto";

/** SHA-256 of a UTF-8 string, returned as Base64 (ZATCA's expected encoding for hashes/PIH). */
export function sha256Base64(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("base64");
}

/** SHA-256 of a UTF-8 string, returned as lowercase hex (used for some internal comparisons/logging). */
export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}
