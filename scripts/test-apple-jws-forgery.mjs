/**
 * Regression test for the Apple JWS certificate-chain forgery fix
 * (lib/apple-jws.ts, Audit H8 follow-up).
 *
 * Before this fix, /api/mobile-purchases/verify's Apple JWS handling only
 * checked that a token's signature matched whatever leaf certificate the
 * CALLER supplied in its own `x5c` header — never that the leaf was
 * actually issued by Apple. Since the caller controls the entire JWS
 * including its header, this meant anyone could generate their own key
 * pair, self-sign a certificate, and forge a "verified" purchase with any
 * claims they wanted (bundleId, productId, environment: "Production", no
 * revocationDate, far-future expiresDate) for zero real Apple transaction —
 * free lifetime family access.
 *
 * Both scenarios below MUST be rejected by verifyAppleJwsChainAndDecode:
 *   1. A single self-signed leaf cert used directly as x5c[0].
 *   2. A leaf cert cryptographically signed by an attacker-controlled "CA"
 *      whose Subject/Issuer name is deliberately set to impersonate Apple's
 *      real root ("CN=Apple Root CA - G3, O=Apple Inc., C=US") — proving
 *      the check validates real signatures against our pinned root's actual
 *      public key, not just a string comparison of certificate names.
 *
 * Usage: node --experimental-strip-types scripts/test-apple-jws-forgery.mjs
 * Exit code 0 if both forged tokens were correctly rejected, 1 otherwise.
 */
import selfsigned from "selfsigned";
import { SignJWT, importPKCS8 } from "jose";
import { verifyAppleJwsChainAndDecode } from "../lib/apple-jws.ts";

const certToDerB64 = (pem) =>
  pem.replace(/-----BEGIN CERTIFICATE-----/, "").replace(/-----END CERTIFICATE-----/, "").replace(/\s+/g, "");

function forgedClaims(transactionId) {
  return {
    bundleId: "com.themuslimman.seerah",
    productId: "seerah_lifetime_family",
    transactionId,
    originalTransactionId: transactionId,
    environment: "Production",
    expiresDate: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10,
  };
}

let failures = 0;

async function expectRejected(name, jwsPromise) {
  try {
    const claims = await jwsPromise;
    console.error(`FAIL (${name}): forged JWS was ACCEPTED — vulnerability still present!`, claims);
    failures++;
  } catch (e) {
    console.log(`PASS (${name}): forged JWS correctly REJECTED — "${e.message.split("\n")[0]}"`);
  }
}

// ── Scenario 1: bare self-signed leaf ──────────────────────────────────────
{
  const pems = await selfsigned.generate([{ name: "commonName", value: "Totally Not Apple" }], {
    keyType: "ec",
    curve: "P-256",
    algorithm: "sha256",
    days: 365,
  });
  const privateKey = await importPKCS8(pems.private, "ES256");
  const jws = await new SignJWT(forgedClaims("FORGED-1"))
    .setProtectedHeader({ alg: "ES256", x5c: [certToDerB64(pems.cert)] })
    .sign(privateKey);
  await expectRejected("bare self-signed leaf", verifyAppleJwsChainAndDecode(jws));
}

// ── Scenario 2: leaf signed by an attacker "CA" impersonating Apple's name ──
{
  const fakeRoot = await selfsigned.generate(
    [
      { name: "commonName", value: "Apple Root CA - G3" },
      { name: "organizationName", value: "Apple Inc." },
      { name: "countryName", value: "US" },
    ],
    { keyType: "ec", curve: "P-256", algorithm: "sha256", days: 365 },
  );
  const leaf = await selfsigned.generate([{ name: "commonName", value: "Fake Leaf" }], {
    keyType: "ec",
    curve: "P-256",
    algorithm: "sha256",
    days: 365,
    ca: { key: fakeRoot.private, cert: fakeRoot.cert },
  });
  const privateKey = await importPKCS8(leaf.private, "ES256");
  const jws = await new SignJWT(forgedClaims("FORGED-2"))
    .setProtectedHeader({ alg: "ES256", x5c: [certToDerB64(leaf.cert), certToDerB64(fakeRoot.cert)] })
    .sign(privateKey);
  await expectRejected("leaf signed by name-impersonating fake root", verifyAppleJwsChainAndDecode(jws));
}

console.log(`\n=== ${failures === 0 ? "All scenarios passed" : `${failures} scenario(s) FAILED`} ===`);
process.exit(failures > 0 ? 1 : 0);
