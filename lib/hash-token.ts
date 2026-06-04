import { createHash } from "crypto";

/**
 * SHA-256 hash a short token for safe DB storage.
 *
 * The raw token is sent to the user (in a cookie or email link).
 * Only the hash is stored in the database so that a DB leak cannot
 * be used to hijack sessions or one-time tokens.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
