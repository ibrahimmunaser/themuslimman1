/**
 * Shared Google Play Developer API access — used by both
 * /api/mobile-purchases/verify (client-driven verification) and
 * /api/webhooks/google-play-notifications (server-push revocation/renewal
 * updates, Audit H8). Kept in one place so the OAuth2 token exchange and
 * raw API fetch logic can't drift between the two call sites.
 */

export const ANDROID_PACKAGE_NAME = "com.themuslimman.seerah";

export async function getGoogleAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is not set. " +
        "Create a service account in Google Cloud Console with the 'Android Publisher' role " +
        "and store the JSON key as a single-line environment variable.",
    );
  }

  let key: { client_email: string; private_key: string; token_uri: string };
  try {
    key = JSON.parse(keyJson);
  } catch (e) {
    // An unguarded JSON.parse here previously threw a raw SyntaxError
    // straight out of this function — e.g. from a copy-paste truncation
    // when setting the env var — which every call site propagates as an
    // opaque 500 with no actionable message. Surface a clear, specific error
    // instead so a misconfigured key is obviously distinguishable from a
    // genuine Google API outage in logs/monitoring.
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!key.client_email || !key.private_key || !key.token_uri) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is missing required field(s) " +
        "(client_email, private_key, token_uri) — re-download the service account JSON key from " +
        "Google Cloud Console.",
    );
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

  function b64url(obj: unknown) {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  }

  const unsigned = `${b64url(header)}.${b64url(claim)}`;

  const { createSign } = await import("crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(key.private_key, "base64url");
  const signedJwt = `${unsigned}.${signature}`;

  const tokenRes = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Failed to obtain Google OAuth2 access token");
  return tokenData.access_token;
}

// Real Google Play purchase tokens are long opaque base64url-ish strings
// (typically 100-200+ chars, no path separators). Rejecting anything
// obviously malformed BEFORE it's spliced into a URL path segment closes
// off path-traversal/URL-manipulation attempts (e.g. a token containing
// "/" or ".." aimed at a different path on androidpublisher.googleapis.com)
// and gives a clear 4xx instead of a confusing raw Google API error for
// garbage input. Deliberately generous on charset/length since Google
// doesn't publish a strict token format guarantee.
const MAX_TOKEN_LENGTH = 4096;
function assertValidPurchaseToken(purchaseToken: unknown): asserts purchaseToken is string {
  if (
    typeof purchaseToken !== "string" ||
    purchaseToken.length === 0 ||
    purchaseToken.length > MAX_TOKEN_LENGTH ||
    /[\s/?#]/.test(purchaseToken)
  ) {
    throw new Error("Invalid purchaseToken format");
  }
}
function assertValidProductId(productId: unknown): asserts productId is string {
  if (
    typeof productId !== "string" ||
    productId.length === 0 ||
    productId.length > 256 ||
    /[\s/?#]/.test(productId)
  ) {
    throw new Error("Invalid productId format");
  }
}

/** Raw subscriptionsv2 lookup by purchaseToken — NOT scoped to a product ID. */
export async function fetchAndroidSubscriptionV2(purchaseToken: string): Promise<{
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}> {
  assertValidPurchaseToken(purchaseToken);
  const accessToken = await getGoogleAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

/**
 * Cancels a Play subscription so it stops renewing (does not refund the
 * current period, mirroring `stripe.subscriptions.cancel()`'s "stop future
 * billing" semantics used by /api/account/delete).
 *
 * Audit H1 fix: previously any 404/410 was treated as success. That was
 * wrong when our stored productId was stale (plan change kept the same
 * purchaseToken but changed the SKU) — cancel hits
 * /subscriptions/{wrongSku}/tokens/{token}:cancel → 404 → we deleted the
 * user while Play kept renewing. Now:
 *  - 2xx → success
 *  - 410 → genuinely gone → success
 *  - 404 → re-fetch via subscriptionsv2 (token-only, authoritative SKU).
 *    If Play says the sub is already expired/gone → success.
 *    If Play returns a different productId still entitled → retry cancel
 *    with that SKU. If that also fails → not ok (block account delete).
 */
export async function cancelAndroidSubscription(
  purchaseToken: string,
  productId: string,
): Promise<{ ok: boolean; status: number }> {
  assertValidPurchaseToken(purchaseToken);
  assertValidProductId(productId);

  async function attemptCancel(sku: string): Promise<{ ok: boolean; status: number }> {
    const accessToken = await getGoogleAccessToken();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(purchaseToken)}:cancel`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { ok: res.ok, status: res.status };
  }

  const first = await attemptCancel(productId);
  if (first.ok || first.status === 410) return { ok: true, status: first.status };
  if (first.status !== 404) return first;

  // 404 on the stored SKU — resolve the live productId via subscriptionsv2
  // before treating this as "already canceled".
  let live: { ok: boolean; status: number; data: Record<string, unknown> };
  try {
    live = await fetchAndroidSubscriptionV2(purchaseToken);
  } catch {
    return { ok: false, status: first.status };
  }
  if (!live.ok) {
    // Token truly unknown to Play → nothing left to cancel.
    if (live.status === 404 || live.status === 410) return { ok: true, status: live.status };
    return { ok: false, status: live.status };
  }

  const subState = live.data.subscriptionState as string | undefined;
  const lineItems =
    (live.data.lineItems as Array<{ expiryTime?: string; productId?: string }>) ?? [];
  const liveSku =
    lineItems.find((l) => typeof l.productId === "string" && l.productId.length > 0)?.productId ??
    null;
  // ON_HOLD / PAUSED can still resume and bill — cancel is still required.
  // Only EXPIRED (or CANCELED, where auto-renew is already off) is safe to
  // treat as "nothing left to cancel".
  const mustStillCancel =
    subState === "SUBSCRIPTION_STATE_ACTIVE" ||
    subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    subState === "SUBSCRIPTION_STATE_ON_HOLD" ||
    subState === "SUBSCRIPTION_STATE_PAUSED";
  if (!mustStillCancel) {
    return { ok: true, status: 404 };
  }
  if (!liveSku || liveSku === productId) {
    // Same (or missing) SKU still billable but cancel 404'd — don't pretend success.
    return { ok: false, status: first.status };
  }
  const retry = await attemptCancel(liveSku);
  return { ok: retry.ok || retry.status === 410, status: retry.status };
}

/**
 * Acknowledges a Play purchase server-side, immediately after this API
 * confirms it's valid. Google auto-refunds ANY purchase (subscription or
 * one-time product) left unacknowledged for 3 days — the client SDK's own
 * `completePurchase()` call (see iap_provider.dart's `_finalize`) normally
 * covers this, but that's a best-effort client-side step with no retry: if
 * the app crashes, loses network, or is killed by the OS in the brief window
 * between this route confirming the purchase and the client's own
 * acknowledge call landing, the purchase is left acknowledged nowhere. The
 * OS purchase-stream replay on next app open usually recovers it, but a user
 * who doesn't reopen the app within 3 days (having just paid for access they
 * may not have even tried yet) would silently get auto-refunded despite the
 * purchase being fully verified and access already granted server-side.
 * Acknowledging here as well closes that gap — idempotent, since
 * re-acknowledging an already-acknowledged purchase is a documented no-op
 * from Google's client SDK, and any Play API error acknowledging an
 * already-acked purchase here is treated as success (nothing left to do).
 */
export async function acknowledgeAndroidPurchase(
  purchaseToken: string,
  productId: string,
  isSubscription: boolean,
): Promise<{ ok: boolean; status: number }> {
  assertValidPurchaseToken(purchaseToken);
  assertValidProductId(productId);

  async function attemptAck(sku: string): Promise<{ ok: boolean; status: number }> {
    const accessToken = await getGoogleAccessToken();
    const url = isSubscription
      ? `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`
      : `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { ok: res.ok, status: res.status };
  }

  const first = await attemptAck(productId);
  // 400 almost always means already acknowledged — treat as success.
  if (first.ok || first.status === 400 || first.status === 410) {
    return { ok: true, status: first.status };
  }
  if (!isSubscription || first.status !== 404) return first;

  // Stale SKU 404 — resolve live productId via subscriptionsv2 (same as cancel).
  let live: { ok: boolean; status: number; data: Record<string, unknown> };
  try {
    live = await fetchAndroidSubscriptionV2(purchaseToken);
  } catch {
    return first;
  }
  if (!live.ok) return first;
  const lineItems =
    (live.data.lineItems as Array<{ productId?: string }>) ?? [];
  const liveSku =
    lineItems.find((l) => typeof l.productId === "string" && l.productId.length > 0)?.productId ??
    null;
  if (!liveSku || liveSku === productId) return first;
  const retry = await attemptAck(liveSku);
  return { ok: retry.ok || retry.status === 400 || retry.status === 410, status: retry.status };
}

/** Raw one-time product (lifetime) purchase lookup by purchaseToken + productId. */
export async function fetchAndroidProduct(
  purchaseToken: string,
  productId: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  assertValidPurchaseToken(purchaseToken);
  assertValidProductId(productId);
  const accessToken = await getGoogleAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}
