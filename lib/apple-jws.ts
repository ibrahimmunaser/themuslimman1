import { X509Certificate } from "crypto";

/**
 * Apple Root CA - G3, pinned at build time from
 * https://www.apple.com/certificateauthority/AppleRootCA-G3.cer
 * (self-signed, valid 2014-04-30 → 2039-04-30, SHA-256 fingerprint
 * 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79 —
 * matches Apple's publicly documented value). This is the trust anchor for
 * every StoreKit 2 signed transaction/notification.
 */
const APPLE_ROOT_CA_G3_BASE64 =
  "MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==";

function certFromBase64(b64: string): X509Certificate {
  return new X509Certificate(Buffer.from(b64, "base64"));
}

/**
 * Verifies a StoreKit 2 signed JWS (transaction, renewal info, or App Store
 * Server Notification payload) and returns its decoded claims.
 *
 * ── Why this exists (critical fix) ──
 * The original implementation only checked that the JWS signature matched
 * the leaf certificate embedded in the token's own `x5c` header — but never
 * verified that leaf certificate was actually issued by Apple. Since the
 * caller controls the entire JWS including its header, anyone could
 * generate their own key pair, self-sign a certificate, embed it as x5c[0],
 * and sign whatever claims they wanted (bundleId, productId,
 * environment: "Production", no revocationDate, far-future expiresDate) —
 * a complete forgery indistinguishable from a real Apple-signed purchase,
 * granting free lifetime family access with zero real transaction.
 *
 * This walks the full x5c chain up to a pinned copy of Apple's own Root CA,
 * verifying both the issuer relationship (checkIssued) and the actual
 * cryptographic signature (verify) at every link, plus each certificate's
 * validity window — only THEN does it trust the leaf's public key to verify
 * the outer JWS signature.
 *
 * Known scope limitation: does not perform OCSP/CRL revocation checking of
 * intermediate certificates (Apple's official server library does this).
 * Chain-of-trust + signature + validity-window checks close the forgery
 * hole above; OCSP would only matter if Apple's own intermediate CA cert
 * were compromised/revoked mid-lifetime, a materially smaller residual risk.
 */
export async function verifyAppleJwsChainAndDecode(jws: string): Promise<Record<string, unknown>> {
  const { compactVerify, decodeProtectedHeader } = await import("jose");

  const header = decodeProtectedHeader(jws);
  const x5c = header.x5c;
  if (!Array.isArray(x5c) || x5c.length === 0 || !x5c.every((c) => typeof c === "string")) {
    throw new Error("JWS missing x5c certificate chain");
  }

  const chain = x5c.map((c) => certFromBase64(c as string));
  const root = certFromBase64(APPLE_ROOT_CA_G3_BASE64);
  const fullChain = [...chain, root];

  const now = new Date();
  for (const cert of fullChain) {
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
      throw new Error(`Apple certificate chain has an expired/not-yet-valid certificate: "${cert.subject}"`);
    }
  }

  for (let i = 0; i < fullChain.length - 1; i++) {
    const cert = fullChain[i];
    const issuer = fullChain[i + 1];
    if (!cert.checkIssued(issuer)) {
      throw new Error(`Apple certificate chain broken: "${cert.subject}" was not issued by "${issuer.subject}"`);
    }
    if (!cert.verify(issuer.publicKey)) {
      throw new Error(`Apple certificate chain signature invalid at "${cert.subject}"`);
    }
  }
  // Sanity-check the pinned constant itself is a genuinely self-signed root.
  if (!root.checkIssued(root) || !root.verify(root.publicKey)) {
    throw new Error("Pinned Apple Root CA failed self-signature check");
  }

  const leaf = chain[0];
  const verified = await compactVerify(jws, leaf.publicKey);
  return JSON.parse(new TextDecoder().decode(verified.payload)) as Record<string, unknown>;
}
