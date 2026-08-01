import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveCourseAccess, ensureFamilyProfilesForUser } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { verifyAppleJwsChainAndDecode } from "@/lib/apple-jws";
import { fetchAndroidSubscriptionV2, fetchAndroidProduct, acknowledgeAndroidPurchase } from "@/lib/google-play";

/** Max bytes to store from the Apple/Google raw response. */
const MAX_RAW_RESPONSE_BYTES = 4096;

/** Internal signal used to short-circuit the transaction when the
 * transactionId is already owned by a different real account, without
 * letting Prisma treat it as a retryable serialization failure. */
class TransactionOwnershipConflictError extends Error {}

/**
 * Audit H2 fix: previously EVERY non-401/403 Google Play API failure was
 * thrown as a plain Error and reported to the client as `retryable: true`.
 * That's correct for a transient 5xx/429, but a 400 (malformed
 * purchaseToken/productId) or 404 (token doesn't exist — e.g. already
 * consumed, wrong package name, or a Play Console license-tester token
 * queried after the test purchase expired) is a PERMANENT failure that will
 * never succeed no matter how many times the client retries. Carrying the
 * distinction through explicitly lets the route handler tell the client
 * which case it's in instead of guessing from the HTTP status alone.
 */
class GooglePlayApiError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "GooglePlayApiError";
  }
}

/**
 * Audit M-guest-relink-window: how long a still-anonymous guest account
 * remains eligible to have one of its transactionIds silently re-linked to a
 * DIFFERENT account. The legitimate case this exists for is a near-term
 * reinstall — buy as guest, delete the app, reinstall days/weeks later,
 * "Restore Purchases" replays the same signed Apple/Google receipt under a
 * brand-new guest session, and the row just needs to follow it over.
 *
 * Without any bound, the same relink path is also reachable indefinitely
 * far in the future, and — critically — by a DIFFERENT physical person: iOS
 * Family Sharing (and Google Play Family Library) let multiple separate
 * Apple/Google accounts legitimately produce a verifiable signed receipt for
 * the SAME underlying transactionId. Each family member opening the app
 * (still on their own fresh guest session, having never upgraded) would
 * silently steal the row — and the access tied to it — away from whichever
 * family member last happened to sign in, without warning either party.
 * Bounding the window to a short, reinstall-sized period closes that
 * indefinite hijack surface while still covering the real reinstall case.
 */
const GUEST_RELINK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─────────────────────────────────────────────────────────────────────────────
// Product catalogue — must match App Store Connect / Play Console product IDs
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_META: Record<
  string,
  { planType: "individual" | "family"; purchaseType: "lifetime" | "subscription" }
> = {
  // Google Play / App Store product IDs (must match Play Console exactly)
  seerah_monthly_individual:  { planType: "individual", purchaseType: "subscription" },
  seerah_monthly_family:      { planType: "family",     purchaseType: "subscription" },
  seerah_lifetime_individual: { planType: "individual", purchaseType: "lifetime"     },
  seerah_lifetime_family:     { planType: "family",     purchaseType: "lifetime"     },
  // Alternate IDs if recreated in Play Console later
  individual_monthly:  { planType: "individual", purchaseType: "subscription" },
  family_monthly:      { planType: "family",     purchaseType: "subscription" },
  individual_lifetime: { planType: "individual", purchaseType: "lifetime"     },
  family_lifetime:     { planType: "family",     purchaseType: "lifetime"     },
  // Legacy reverse-DNS IDs — kept as a defensive fallback in case App Store
  // Connect still has these registered from before the seerah_* rename
  // (STORE_RELEASE_CHECKLIST.md still documented these as of 2026-07).
  // Unverified against the live App Store Connect config — safe to keep
  // even if unused; remove once the real ASC product IDs are confirmed.
  "com.themuslimman.seerah.monthly.individual":  { planType: "individual", purchaseType: "subscription" },
  "com.themuslimman.seerah.monthly.family":      { planType: "family",     purchaseType: "subscription" },
  "com.themuslimman.seerah.lifetime.individual": { planType: "individual", purchaseType: "lifetime"     },
  "com.themuslimman.seerah.lifetime.family":     { planType: "family",     purchaseType: "lifetime"     },
};

// ─────────────────────────────────────────────────────────────────────────────
// iOS — App Store receipt / StoreKit 2 JWS verification
//
// Flutter in_app_purchase_storekit ≥0.4 defaults to StoreKit 2, which sends a
// signed transaction JWS in serverVerificationData (not a classic app receipt).
// Passing that JWS to legacy /verifyReceipt returns status 21002 and fails App
// Review (Guideline 2.1(b)). Support both:
//   1) StoreKit 2 JWS — verify ES256 signature via embedded x5c leaf cert
//   2) Classic base64 receipt — /verifyReceipt (prod → sandbox 21007)
// Classic path also searches receipt.in_app (lifetime non-consumables) in
// addition to latest_receipt_info (subscriptions).
// ─────────────────────────────────────────────────────────────────────────────

const APPLE_BUNDLE_ID = "com.themuslimman.seerah";

function looksLikeAppleJws(data: string): boolean {
  if (!data.startsWith("eyJ")) return false;
  const parts = data.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

async function verifyAppleJws(
  jws: string,
  productId: string,
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
  environment: string | null;
}> {
  // verifyAppleJwsChainAndDecode validates the full x5c chain up to Apple's
  // pinned Root CA before trusting the leaf key — see lib/apple-jws.ts for
  // why this matters (the previous inline implementation here only checked
  // the signature against whatever leaf cert the caller supplied, which is
  // trivially forgeable). A chain/signature failure means the JWS is
  // fraudulent (or Apple silently rotated an intermediate we don't have
  // pinned) — treat it as an ordinary invalid-receipt 422, not a 500, since
  // it's indistinguishable from any other invalid receipt to the caller.
  let claims: Record<string, unknown>;
  try {
    claims = await verifyAppleJwsChainAndDecode(jws);
  } catch (e) {
    console.error("[mobile-purchases/verify] Apple JWS chain/signature verification failed:", e);
    return {
      valid: false,
      transactionId: "",
      currentPeriodEnd: null,
      rawResponse: JSON.stringify({ error: "JWS chain/signature verification failed" }).slice(0, MAX_RAW_RESPONSE_BYTES),
      environment: null,
    };
  }
  const raw = JSON.stringify(claims).slice(0, MAX_RAW_RESPONSE_BYTES);

  // StoreKit 2 signs Sandbox and Production transactions with the exact same
  // Apple root CA chain — a valid ES256 signature by itself does NOT prove a
  // transaction came from the real store. Apple's own guidance is to inspect
  // this claim rather than reject Sandbox outright: App Review and our own
  // manual QA (STORE_RELEASE_CHECKLIST.md) both test full purchase flows with
  // Sandbox tester accounts against this exact production endpoint, so a hard
  // reject here would break App Review. Instead we surface it loudly in logs
  // (and persist it below) so a spike of Sandbox transactions in production —
  // e.g. someone trying to get free access with a Sandbox Apple ID — is
  // visible and can be investigated/revoked, rather than silently
  // indistinguishable from a real paid transaction forever.
  const environment = typeof claims.environment === "string" ? claims.environment : null;
  if (environment !== "Production") {
    console.warn(
      `[mobile-purchases/verify] Apple JWS environment="${environment}" (non-Production) ` +
        `productId=${productId} transactionId=${claims.transactionId ?? "?"}`,
    );
  }

  if (claims.bundleId !== APPLE_BUNDLE_ID) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }
  if (claims.productId !== productId) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }
  if (claims.revocationDate != null) {
    return {
      valid: false,
      transactionId: String(claims.originalTransactionId ?? claims.transactionId ?? ""),
      currentPeriodEnd: null,
      rawResponse: raw,
      environment,
    };
  }

  const expiresMs =
    typeof claims.expiresDate === "number"
      ? claims.expiresDate
      : typeof claims.expiresDate === "string"
        ? Number(claims.expiresDate)
        : null;
  if (expiresMs && expiresMs < Date.now()) {
    return {
      valid: false,
      transactionId: String(claims.originalTransactionId ?? claims.transactionId ?? ""),
      currentPeriodEnd: new Date(expiresMs),
      rawResponse: raw,
      environment,
    };
  }

  const transactionId = String(
    claims.originalTransactionId ?? claims.transactionId ?? "",
  );
  if (!transactionId) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }

  return {
    valid: true,
    transactionId,
    currentPeriodEnd: expiresMs ? new Date(expiresMs) : null,
    rawResponse: raw,
    environment,
  };
}

async function verifyAppleReceipt(
  receiptData: string,
  productId: string,
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
  environment: string | null;
}> {
  const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET;
  if (!sharedSecret) {
    throw new Error(
      "APPLE_IAP_SHARED_SECRET is not set. " +
        "Find it in App Store Connect → Apps → [Your App] → In-App Purchases → App-Specific Shared Secret.",
    );
  }

  const payload = {
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  };

  async function attempt(url: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<Record<string, unknown>>;
  }

  // Try production first; fall back to sandbox (status 21007 = sandbox receipt).
  let data = await attempt("https://buy.itunes.apple.com/verifyReceipt");
  if (data.status === 21007) {
    data = await attempt("https://sandbox.itunes.apple.com/verifyReceipt");
  }

  // Truncate to avoid storing huge Apple receipts (latest_receipt can be kilobytes).
  const raw = JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES);

  // Apple's classic response always reports which environment the receipt
  // actually belongs to (independent of which URL answered) — see the
  // matching Sandbox/Production note in verifyAppleJws above; same rationale
  // applies here (log for visibility, don't hard-reject and risk breaking
  // App Review / STORE_RELEASE_CHECKLIST.md sandbox QA).
  const environment = typeof data.environment === "string" ? data.environment : null;
  if (environment !== "Production") {
    console.warn(
      `[mobile-purchases/verify] Apple classic receipt environment="${environment}" (non-Production) productId=${productId}`,
    );
  }

  // Any non-zero status from Apple's API means the receipt is invalid.
  if (data.status !== 0) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }

  // /verifyReceipt only checks the receipt's cryptographic signature — it
  // returns status 0 for ANY genuine App Store receipt, regardless of which
  // app it belongs to. Product IDs are only unique per-app, so without this
  // check an attacker could buy a cheap IAP in an unrelated app of their own
  // with a product ID that happens to collide with one of ours (e.g.
  // "seerah_lifetime_family") and submit that receipt here to get free
  // lifetime access. The StoreKit-2 JWS path already checks this via
  // claims.bundleId; the classic-receipt path needs the equivalent check
  // against receipt.bundle_id.
  const receiptBundleId = (data.receipt as Record<string, unknown> | undefined)
    ?.bundle_id;
  if (receiptBundleId !== APPLE_BUNDLE_ID) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }

  // Subscriptions usually appear in latest_receipt_info; lifetime non-consumables
  // often only appear under receipt.in_app. Search both.
  const latestReceipts =
    (data.latest_receipt_info as Record<string, string>[]) ?? [];
  const inApp =
    ((data.receipt as Record<string, unknown> | undefined)?.in_app as
      | Record<string, string>[]
      | undefined) ?? [];
  const seen = new Set<string>();
  const allTx: Record<string, string>[] = [];
  for (const t of [...latestReceipts, ...inApp]) {
    const id = t.transaction_id || `${t.product_id}:${t.purchase_date_ms}`;
    if (seen.has(id)) continue;
    seen.add(id);
    allTx.push(t);
  }

  const matching = allTx
    .filter((t) => t.product_id === productId)
    .sort((a, b) => Number(b.purchase_date_ms) - Number(a.purchase_date_ms));

  if (!matching.length) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment };
  }

  const latest = matching[0];

  // B2 fix: reject cancelled / refunded transactions.
  // Apple sets cancellation_date_ms when a transaction is refunded or revoked.
  if (latest.cancellation_date_ms) {
    return {
      valid: false,
      transactionId: latest.original_transaction_id ?? latest.transaction_id,
      currentPeriodEnd: null,
      rawResponse: raw,
      environment,
    };
  }

  const transactionId = latest.original_transaction_id ?? latest.transaction_id;
  const expiresMs = latest.expires_date_ms ? Number(latest.expires_date_ms) : null;

  // Reject expired subscriptions. Lifetime products have no expires_date_ms.
  if (expiresMs && expiresMs < Date.now()) {
    return {
      valid: false,
      transactionId,
      currentPeriodEnd: new Date(expiresMs),
      rawResponse: raw,
      environment,
    };
  }

  const currentPeriodEnd = expiresMs ? new Date(expiresMs) : null;
  return { valid: true, transactionId, currentPeriodEnd, rawResponse: raw, environment };
}

async function verifyApple(
  receiptData: string,
  productId: string,
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
  environment: string | null;
}> {
  if (looksLikeAppleJws(receiptData)) {
    return verifyAppleJws(receiptData, productId);
  }
  return verifyAppleReceipt(receiptData, productId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Android — Google Play Developer API verification
// Docs: https://developers.google.com/android-publisher/api-ref/rest/v3
// ─────────────────────────────────────────────────────────────────────────────

async function verifyAndroid(
  purchaseToken: string,
  productId: string,
  purchaseType: "lifetime" | "subscription",
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
  environment: string | null;
  /** When invalid: demote the user's DB row so access doesn't wait on RTDN. */
  demoteAccess?: "hold" | "expired";
}> {
  const { ok, status, data } =
    purchaseType === "subscription"
      ? await fetchAndroidSubscriptionV2(purchaseToken)
      : await fetchAndroidProduct(purchaseToken, productId);
  const raw = JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES);

  if (!ok) {
    // Distinguish Play API / config failures from a genuinely invalid purchase.
    // 401/403 almost always mean the service account is missing Play Console
    // API access — returning a generic "invalid purchase" 422 misleads support.
    const googleMsg =
      (data.error as { message?: string } | undefined)?.message ??
      `Google Play API returned ${status}`;
    console.error(
      `[mobile-purchases/verify] Google Play API ${status} for ${productId}:`,
      googleMsg,
      raw,
    );
    if (status === 401 || status === 403) {
      throw new Error(
        "Google Play API access is not configured. Link a service account with " +
          "Android Publisher access in Play Console → Users and permissions, " +
          "and set GOOGLE_SERVICE_ACCOUNT_KEY on the server.",
      );
    }
    // 400 (malformed token/productId) and 404 (token not found — already
    // consumed, wrong package name, expired license-tester token, etc.) are
    // permanent: the exact same request will fail identically on every
    // retry. 429/5xx (and anything else) are genuinely transient Play API
    // hiccups worth retrying. See GooglePlayApiError above.
    const isPermanent = status === 400 || status === 404 || status === 410;
    throw new GooglePlayApiError(`Google Play verification failed (${status}): ${googleMsg}`, !isPermanent);
  }

  if (purchaseType === "subscription") {
    // subscriptionsv2 subscriptionState values:
    //   SUBSCRIPTION_STATE_ACTIVE          — active and billing
    //   SUBSCRIPTION_STATE_IN_GRACE_PERIOD — billing failed but grace period active
    //   SUBSCRIPTION_STATE_ON_HOLD         — billing suspended (do not grant access)
    //   SUBSCRIPTION_STATE_PAUSED          — user paused (do not grant access)
    //   SUBSCRIPTION_STATE_CANCELED        — auto-renew off; STILL entitled until expiryTime
    //   SUBSCRIPTION_STATE_EXPIRED         — expired (do not grant access)
    //
    // Audit C1 fix: CANCELED previously returned valid:false immediately,
    // cutting access the moment the user turned off auto-renew — even when
    // expiryTime was still in the future. That contradicts Google's own
    // entitlement model, Stripe's cancel_at_period_end, and Apple (where we
    // grant access until expiresDate regardless of autoRenewStatus). Keep
    // CANCELED entitled through the paid period; EXPIRED / ON_HOLD / PAUSED
    // still deny.
    const subState = data.subscriptionState as string | undefined;
    const isEntitledState =
      subState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
      subState === "SUBSCRIPTION_STATE_CANCELED";

    if (!isEntitledState) {
      const demoteAccess =
        subState === "SUBSCRIPTION_STATE_ON_HOLD" ||
        subState === "SUBSCRIPTION_STATE_PAUSED"
          ? ("hold" as const)
          : ("expired" as const);
      return {
        valid: false,
        transactionId: purchaseToken,
        currentPeriodEnd: null,
        rawResponse: raw,
        environment: null,
        demoteAccess,
      };
    }

    const lineItems =
      (data.lineItems as Array<{ expiryTime?: string; productId: string }>) ?? [];
    // subscriptionsv2's token lookup is NOT scoped to a product — it's keyed
    // only by purchaseToken — so a client could send a real, valid token for
    // its actual Individual plan alongside a claimed productId of the more
    // expensive Family plan. Never silently fall back to lineItems[0]: if the
    // caller's claimed productId isn't actually one of the verified line
    // items, this is either a bug or a plan-escalation attempt — reject it.
    const item = lineItems.find((l) => l.productId === productId);
    if (!item) {
      console.warn(
        `[mobile-purchases/verify] Android productId mismatch: claimed "${productId}" not found in verified lineItems`,
        raw,
      );
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment: null };
    }
    const expiryTime = item.expiryTime ? new Date(item.expiryTime) : null;

    // Missing expiryTime is ambiguous for EVERY entitled state — refuse
    // rather than granting open-ended access (ACTIVE previously fell through).
    if (!expiryTime) {
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment: null };
    }

    // Verify the subscription has not already expired. CANCELED with a past
    // expiryTime is treated as expired (valid:false) — same as EXPIRED.
    if (expiryTime < new Date()) {
      return {
        valid: false,
        transactionId: purchaseToken,
        currentPeriodEnd: expiryTime,
        rawResponse: raw,
        environment: null,
        demoteAccess: "expired",
      };
    }

    // subscriptionsv2 includes a `testPurchase` object (even if empty) when the
    // purchase was made by a Play Console license tester rather than a real
    // paying customer — surface it the same way the Apple sandbox/environment
    // checks above do, so a spike of license-tester purchases in production
    // logs/rawResponse is visible instead of silently indistinguishable from
    // real revenue (mirrors the Apple JWS environment handling above).
    const isTestPurchase = data.testPurchase != null;
    if (isTestPurchase) {
      console.warn(
        `[mobile-purchases/verify] Android license-tester subscription purchase productId=${productId}`,
      );
    }

    // Audit M-android-sub-row fix: subscriptionsv2's `latestOrderId` is
    // reissued on EVERY renewal (e.g. "GPA.3313-...-...-12345..0" becomes
    // "...12345..1" next cycle) — it identifies a single billing charge, not
    // the subscription itself. transactionId is this table's @unique upsert
    // key (see the upsert below, keyed on transactionId), so using
    // latestOrderId here meant every renewal inserted a brand-new
    // MobilePurchase row instead of updating the existing one, leaving
    // stale duplicate rows behind. Worse: the RTDN webhook
    // (app/api/webhooks/google-play-notifications/route.ts) looks up the
    // row to update by `purchaseToken` alone via findFirst — with
    // duplicates sharing that same purchaseToken, a refund/revocation could
    // silently patch the wrong (older, already-superseded) row while the
    // real active one stayed "active" forever. purchaseToken is the value
    // Google — and this codebase's own webhook — already treats as the
    // stable identity of a subscription across its whole renewal lifetime,
    // so it must be transactionId too. latestOrderId is still fully
    // preserved in rawResponse for audit/support lookups.
    return {
      valid: true,
      transactionId: purchaseToken,
      currentPeriodEnd: expiryTime,
      rawResponse: raw,
      environment: isTestPurchase ? "Test" : null,
    };
  } else {
    // products.get response:
    //   purchaseState 0 = Purchased, 1 = Cancelled, 2 = Pending
    const purchaseState = data.purchaseState as number | undefined;
    if (purchaseState !== 0) {
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment: null };
    }
    // purchaseType: 0 = Test (license tester), 1 = Promo, 2 = Rewarded (ad).
    // Absent = real paid purchase. Same rationale as testPurchase above.
    const purchaseTypeCode = data.purchaseType as number | undefined;
    const androidEnv =
      purchaseTypeCode === 0 ? "Test" : purchaseTypeCode === 1 ? "Promo" : purchaseTypeCode === 2 ? "Rewarded" : null;
    if (androidEnv) {
      console.warn(
        `[mobile-purchases/verify] Android non-standard purchase (${androidEnv}) productId=${productId}`,
      );
    }
    // Audit M3 fix: orderId was previously trusted via a bare `as string`
    // cast with no runtime check — Google's products.get response can omit
    // it in rare edge cases (e.g. certain promo/test paths), which would
    // silently produce transactionId="" or "undefined" here. transactionId
    // is this table's @unique upsert key (see the subscription branch's
    // comment above), so multiple such purchases could collide on the same
    // empty key and overwrite each other's MobilePurchase row. Mirrors the
    // same empty-transactionId guard the Apple JWS verification path above
    // already has.
    const orderId = typeof data.orderId === "string" ? data.orderId : "";
    if (!orderId) {
      console.error(
        `[mobile-purchases/verify] Android products.get response missing orderId productId=${productId}`,
      );
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw, environment: androidEnv };
    }
    return { valid: true, transactionId: orderId, currentPeriodEnd: null, rawResponse: raw, environment: androidEnv };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/mobile-purchases/verify
 *
 * Body (iOS):
 *   { platform: "apple", productId: string, receiptData: string }
 *
 * Body (Android):
 *   { platform: "google", productId: string, purchaseToken: string, orderId?: string }
 *   (orderId is accepted for backward compatibility with older app builds but is no
 *   longer used — see the removed dead fallback below, Audit L-orderid-deadcode)
 *
 * Returns:
 *   { success: true, hasAccess: true }   — verified and access granted
 *   { success: false, error: string }    — verification failed
 *   401                                  — unauthenticated
 *   409                                  — transactionId belongs to another account
 *   422                                  — store verification failed
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 verifications per 5 minutes per IP — prevent replay/brute-force.
  const ip = getIP(req);
  const rl = await checkRateLimit(`mobile-verify:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many verification attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // `orderId` may still be present in the request body (older app builds send it)
  // but is intentionally not destructured/used — see verifyAndroid's doc comments:
  // both its branches now always derive transactionId authoritatively from Google's
  // own verified response (purchaseToken for subscriptions, orderId from the
  // verified response itself for one-time products), so a client-supplied orderId
  // can never actually be trusted or needed here.
  const { platform, productId, receiptData, purchaseToken } = body;

  if (!platform || !productId) {
    return NextResponse.json({ error: "platform and productId are required" }, { status: 400 });
  }

  const meta = PRODUCT_META[productId];
  if (!meta) {
    return NextResponse.json({ error: `Unknown productId: ${productId}` }, { status: 400 });
  }

  try {
    let verification: {
      valid: boolean;
      transactionId: string;
      currentPeriodEnd: Date | null;
      rawResponse: string;
      environment: string | null;
    };

    if (platform === "apple") {
      if (!receiptData)
        return NextResponse.json({ error: "receiptData is required for iOS" }, { status: 400 });
      verification = await verifyApple(receiptData, productId);
    } else if (platform === "google") {
      if (!purchaseToken)
        return NextResponse.json({ error: "purchaseToken is required for Android" }, { status: 400 });
      // Real Google Play purchase tokens are long opaque strings with no
      // whitespace/path characters — reject anything else up front with a
      // clear 400 rather than letting it fall through to
      // fetchAndroidSubscriptionV2/fetchAndroidProduct's own defensive
      // assertion, which would otherwise surface as an opaque 500
      // "Purchase verification failed. Please try again." (misleadingly
      // marked retryable, when malformed input can never succeed on retry).
      if (typeof purchaseToken !== "string" || purchaseToken.length > 4096 || /[\s/?#]/.test(purchaseToken)) {
        return NextResponse.json({ success: false, error: "Invalid purchaseToken format" }, { status: 400 });
      }
      verification = await verifyAndroid(purchaseToken, productId, meta.purchaseType);
    } else {
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
    }

    if (!verification.valid) {
      // Client verify is often the only live Play re-check (resume hits
      // access/check which trusts the DB). Demote ON_HOLD/PAUSED/EXPIRED
      // rows immediately so access doesn't linger until RTDN arrives.
      const demote =
        "demoteAccess" in verification
          ? (verification as { demoteAccess?: "hold" | "expired" }).demoteAccess
          : undefined;
      if (platform === "google" && purchaseToken && demote) {
        try {
          await prisma.mobilePurchase.updateMany({
            where: {
              purchaseToken,
              platform: "google",
              userId: user.id,
              status: "active",
            },
            data: {
              // hold: keep status active + past periodEnd so account-delete
              // still cancels Play billing; expired: mark expired.
              status: demote === "hold" ? "active" : "expired",
              currentPeriodEnd: new Date(0),
              rawResponse: verification.rawResponse,
              verifiedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } catch (e) {
          console.error("[mobile-purchases/verify] Failed to demote inactive Play sub:", e);
        }
      }
      return NextResponse.json(
        { success: false, error: "Purchase verification failed — the transaction is invalid, expired, or refunded." },
        { status: 422 },
      );
    }

    // B3 fix: Cross-account idempotency guard.
    // If this transactionId was already verified by a DIFFERENT user, reject
    // the request with 409 rather than silently updating the wrong record —
    // UNLESS the current owner is an anonymous (guest) account. Anonymous
    // accounts are device-linked, not identity-linked (Guideline 5.1.1(v)),
    // so if the app was reinstalled and a fresh guest session was created,
    // the original guest account is abandoned and its purchase should follow
    // whoever can prove ownership via Apple's receipt (i.e. re-link it here).
    // A REAL account (has a password) can never be silently re-linked away —
    // that guard still applies below.
    //
    // The ownership check and the upsert used to be two separate statements,
    // leaving a TOCTOU window: two concurrent requests for the same
    // never-before-seen transactionId (e.g. a leaked/sniffed receipt) could
    // both pass the "existing is null" check, then race in the upsert, with
    // the update branch unconditionally setting userId to whichever request
    // finished last. Serializable isolation + retry (same pattern used for
    // the profile-creation race) closes that window.
    // Best-effort duplicate-purchase signal (Audit M-double-charge): only
    // meaningful for a genuinely NEW transactionId, computed just before the
    // transaction below. Deliberately NOT run inside that transaction (and
    // tolerant of the small race against a same-instant second purchase) —
    // this only ever flags a row for a human to review/refund, it never
    // blocks or alters the purchase itself, so it doesn't need transactional
    // guarantees. Re-verification of an already-owned transaction (renewals)
    // is excluded below since the existing purchase itself would otherwise
    // make hasActiveCourseAccess trivially true.
    const isNewTransaction =
      (await prisma.mobilePurchase.findUnique({
        where: { transactionId: verification.transactionId },
        select: { userId: true },
      }))?.userId !== user.id;
    const hadAccessBeforeThisPurchase =
      isNewTransaction && (await hasActiveCourseAccess(user.id, user.hasPaid));
    if (hadAccessBeforeThisPurchase) {
      console.warn(
        `[mobile-purchases/verify] Possible double charge: user ${user.id} already had active course ` +
          `access before verifying new transaction ${verification.transactionId} (platform=${platform}, productId=${productId})`,
      );
    }

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const existing = await tx.mobilePurchase.findUnique({
              where: { transactionId: verification.transactionId },
              select: {
                userId: true,
                user: { select: { isAnonymous: true, createdAt: true } },
              },
            });
            if (existing && existing.userId !== user.id) {
              const sourceAccountAgeMs = Date.now() - existing.user.createdAt.getTime();
              const withinRelinkWindow = sourceAccountAgeMs <= GUEST_RELINK_WINDOW_MS;
              if (!existing.user.isAnonymous || !withinRelinkWindow) {
                throw new TransactionOwnershipConflictError();
              }
              console.log(
                `[mobile-purchases/verify] Re-linking transaction ${verification.transactionId} ` +
                  `from abandoned guest account ${existing.userId} (age ${Math.round(sourceAccountAgeMs / 86_400_000)}d) to ${user.id}`,
              );
            }

            await tx.mobilePurchase.upsert({
              where: { transactionId: verification.transactionId },
              create: {
                id: nanoid(),
                userId: user.id,
                platform,
                productId,
                transactionId: verification.transactionId,
                purchaseToken: platform === "google" ? purchaseToken : null,
                planType: meta.planType,
                purchaseType: meta.purchaseType,
                status: "active",
                currentPeriodEnd: verification.currentPeriodEnd,
                rawResponse: verification.rawResponse,
                environment: verification.environment,
                possibleDuplicate: hadAccessBeforeThisPurchase,
                updatedAt: new Date(),
              },
              update: {
                // Re-verification refreshes the record for subscription renewals.
                // userId is included so re-linking an abandoned guest account's
                // purchase (see re-link comment above) actually takes effect.
                // Audit H1: also refresh productId / planType / purchaseToken so
                // a plan change (same token, new SKU) doesn't leave account-delete
                // cancel + server acknowledge targeting a stale productId URL
                // (which returns 404 that was previously treated as "already
                // canceled" success — orphaning active Play billing).
                userId: user.id,
                productId,
                planType: meta.planType,
                purchaseType: meta.purchaseType,
                purchaseToken: platform === "google" ? purchaseToken : null,
                status: "active",
                currentPeriodEnd: verification.currentPeriodEnd,
                rawResponse: verification.rawResponse,
                environment: verification.environment,
                verifiedAt: new Date(),
                updatedAt: new Date(),
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (e) {
        if (e instanceof TransactionOwnershipConflictError) {
          // The common cause: this device is a fresh guest session (e.g.
          // after a reinstall) but the purchase is already linked to the
          // user's own REAL account from before they upgraded — Sign In is
          // the actual, already-built fix, not a dead end requiring support.
          return NextResponse.json(
            {
              success: false,
              error:
                "This purchase is already linked to an account. If you previously created an " +
                "account (email/password), please Sign In to restore it — otherwise contact " +
                "support@themuslimman.com if you believe this is an error.",
            },
            { status: 409 },
          );
        }
        const isSerializationFailure =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
        if (!isSerializationFailure || attempt === maxAttempts) throw e;
        await new Promise((r) => setTimeout(r, 50 * attempt));
      }
    }

    // Audit H2 fix: server-side acknowledge, in addition to the client's own
    // completePurchase() — see acknowledgeAndroidPurchase's doc comment for
    // why relying on the client call alone risks a 3-day auto-refund.
    // Best-effort and non-blocking: this must never fail the response for a
    // purchase that Google and this route both already confirmed is valid.
    if (platform === "google" && purchaseToken) {
      acknowledgeAndroidPurchase(purchaseToken, productId, meta.purchaseType === "subscription")
        .then((result) => {
          if (!result.ok) {
            console.warn(
              `[mobile-purchases/verify] Server-side Play acknowledge returned ${result.status} for ` +
                `productId=${productId} (likely already acknowledged by the client — not fatal)`,
            );
          }
        })
        .catch((e) => console.error("[mobile-purchases/verify] Server-side Play acknowledge failed:", e));
    }

    // Update user.planType to family if this is a family purchase.
    // Lifetime mobile purchases also set hasPaid so access checks that only
    // look at the User row (session short-circuit) stay consistent with Stripe.
    const userUpdate: { planType?: "family"; hasPaid?: boolean } = {};
    if (meta.planType === "family" && user.planType !== "family") {
      userUpdate.planType = "family";
    }
    if (meta.purchaseType === "lifetime" && !user.hasPaid) {
      userUpdate.hasPaid = true;
    }
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: userUpdate });
    }

    // Match Stripe family checkout: pre-fill learner slots so Profiles is ready
    // immediately for the household (idempotent if slots already exist).
    const planType = userUpdate.planType ?? user.planType ?? "individual";
    if (planType === "family") {
      await ensureFamilyProfilesForUser(user.id).catch((e) =>
        console.error("[mobile-purchases/verify] ensureFamilyProfilesForUser failed:", e),
      );
    }

    const hasAccess = await hasActiveCourseAccess(user.id, userUpdate.hasPaid ?? user.hasPaid);

    // Do NOT auto-set emailVerified — payment is not inbox proof.
    // Access is granted via hasAccess; part-access and mobile UI gate on
    // hasAccess (not emailVerified). Profile shows a soft verify prompt.
    // Matches Stripe webhooks (Apple 5.1.1(v) content unlock).
    const emailVerified = user.emailVerified;

    return NextResponse.json({
      success: true,
      hasAccess,
      isFamily: planType === "family",
      planType,
      emailVerified,
    });
  } catch (err) {
    console.error("[mobile-purchases/verify]", err);
    if (err instanceof GooglePlayApiError) {
      return NextResponse.json(
        {
          success: false,
          error: err.retryable
            ? "We could not verify this purchase with Google Play. Please try Restore Purchases, or contact support@themuslimman.com."
            : "This purchase could not be recognized by Google Play (the purchase token is invalid, already used, or expired). Please try Restore Purchases, or contact support@themuslimman.com.",
          retryable: err.retryable,
        },
        { status: err.retryable ? 502 : 422 },
      );
    }
    const message =
      err instanceof Error && err.message.startsWith("Google Play")
        ? err.message
        : err instanceof Error && err.message.startsWith("APPLE_IAP")
          ? err.message
          : err instanceof Error && err.message.startsWith("GOOGLE_SERVICE_ACCOUNT")
            ? err.message
            : "Purchase verification failed. Please try again.";
    const isConfig =
      message.includes("not configured") ||
      message.includes("not set") ||
      message.includes("API access") ||
      message.includes("OAuth2") ||
      message.includes("GOOGLE_SERVICE_ACCOUNT") ||
      message.includes("APPLE_IAP");
    return NextResponse.json(
      {
        success: false,
        error: isConfig
          ? "Purchase verification is temporarily unavailable. Please try again shortly, or contact support@themuslimman.com."
          : message.startsWith("Google Play verification failed")
            ? "We could not verify this purchase with Google Play. Please try Restore Purchases, or contact support@themuslimman.com."
            : message,
        // A missing/misconfigured env var (APPLE_IAP_SHARED_SECRET /
        // GOOGLE_SERVICE_ACCOUNT_KEY) will never succeed on retry — tell the
        // client explicitly so it doesn't burn 3 retries (and 3x the calls
        // to Apple/Google) during exactly the kind of incident where that's
        // most costly. The status code alone (502) isn't enough signal since
        // the client's existing retry policy treats any 5xx as transient.
        retryable: !isConfig,
      },
      { status: isConfig ? 502 : 500 },
    );
  }
}
