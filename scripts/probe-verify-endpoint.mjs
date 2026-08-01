const BASE = "https://themuslimman.com";

// 1. Create a fresh guest session (mirrors what the app does before purchase).
const anonRes = await fetch(`${BASE}/api/auth/mobile-anonymous`, { method: "POST" });
const setCookie = anonRes.headers.get("set-cookie");
const anonData = await anonRes.json();
console.log("mobile-anonymous status:", anonRes.status, JSON.stringify(anonData));

if (!setCookie) {
  console.log("No cookie returned — cannot proceed.");
  process.exit(1);
}
// Keep only the cookie name=value pairs (strip attributes) for the next request.
const cookieHeader = setCookie.split(/,(?=[^;]+?=)/).map(c => c.split(";")[0]).join("; ");

// 2. Call verify with a deliberately fake purchase token for a real product ID.
// This exercises the exact same getGoogleAccessToken() + Play Developer API
// code path as a real purchase, without needing a real purchase token.
const verifyRes = await fetch(`${BASE}/api/mobile-purchases/verify`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader },
  body: JSON.stringify({
    platform: "google",
    productId: "seerah_lifetime_family",
    purchaseToken: "FAKE_TOKEN_FOR_DIAGNOSTIC_PROBE",
    orderId: "FAKE_ORDER_ID",
  }),
});
const verifyData = await verifyRes.json();
console.log("\nverify status:", verifyRes.status);
console.log("verify response:", JSON.stringify(verifyData, null, 2));
