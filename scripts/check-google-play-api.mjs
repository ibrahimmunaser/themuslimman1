import fs from "fs";

const envText = fs.readFileSync(".env.vercel.production", "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!keyJson) {
  console.log("GOOGLE_SERVICE_ACCOUNT_KEY is NOT set.");
  process.exit(1);
}

let key;
try {
  key = JSON.parse(keyJson);
  console.log("Parsed service account key OK. client_email =", key.client_email);
  console.log("project_id =", key.project_id);
} catch (e) {
  console.log("FAILED to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON:", e.message);
  console.log("Raw value length:", keyJson.length);
  console.log("First 80 chars:", keyJson.slice(0, 80));
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const header = { alg: "RS256", typ: "JWT" };
const claim = {
  iss: key.client_email,
  scope: "https://www.googleapis.com/auth/androidpublisher",
  aud: key.token_uri,
  iat: now,
  exp: now + 3600,
};

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

const unsigned = `${b64url(header)}.${b64url(claim)}`;
const { createSign } = await import("crypto");
const signer = createSign("RSA-SHA256");
signer.update(unsigned);
let signature;
try {
  signature = signer.sign(key.private_key, "base64url");
} catch (e) {
  console.log("FAILED to sign JWT with private_key:", e.message);
  process.exit(1);
}
const signedJwt = `${unsigned}.${signature}`;

const tokenRes = await fetch(key.token_uri, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: signedJwt,
  }),
});
const tokenData = await tokenRes.json();
console.log("Token endpoint status:", tokenRes.status);
console.log("Token response:", JSON.stringify(tokenData).slice(0, 500));

if (!tokenData.access_token) {
  console.log("FAILED to obtain access token.");
  process.exit(1);
}

console.log("\nAccess token obtained OK. Testing Android Publisher API access...");

const packageName = "com.themuslimman.seerah";
// Use the edits.insert endpoint just to test permission (harmless, doesn't publish anything if we don't commit).
const testUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/seerah_lifetime_family/tokens/FAKE_TOKEN_FOR_PERMISSION_TEST`;
const apiRes = await fetch(testUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
const apiData = await apiRes.json();
console.log("Android Publisher API status:", apiRes.status);
console.log("Android Publisher API response:", JSON.stringify(apiData).slice(0, 800));
