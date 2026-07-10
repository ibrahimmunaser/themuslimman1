import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/** Max bytes to store from the Apple/Google raw response. */
const MAX_RAW_RESPONSE_BYTES = 4096;

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
// iOS — App Store receipt verification
//
// Uses the legacy /verifyReceipt endpoint (still supported as of 2026).
// TODO: Migrate to the App Store Server API (https://developer.apple.com/documentation/appstoreserverapi)
//       using signed JWS transactions from StoreKit 2. The new API provides
//       per-transaction status, revocation events, and consumption history.
//       Required keys: APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_PRIVATE_KEY (.p8).
//       Migration guide: https://developer.apple.com/videos/play/wwdc2023/10143
// ─────────────────────────────────────────────────────────────────────────────

async function verifyApple(
  receiptData: string,
  productId: string,
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
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

  // Any non-zero status from Apple's API means the receipt is invalid.
  if (data.status !== 0) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw };
  }

  // Find the most recent transaction for the given product.
  const latestReceipts = (data.latest_receipt_info as Record<string, string>[]) ?? [];
  const matching = latestReceipts
    .filter((t) => t.product_id === productId)
    .sort((a, b) => Number(b.purchase_date_ms) - Number(a.purchase_date_ms));

  if (!matching.length) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw };
  }

  const latest = matching[0];

  // B2 fix: reject cancelled / refunded transactions.
  // Apple sets cancellation_date_ms when a transaction is refunded or revoked.
  if (latest.cancellation_date_ms) {
    return { valid: false, transactionId: latest.original_transaction_id ?? latest.transaction_id, currentPeriodEnd: null, rawResponse: raw };
  }

  const transactionId = latest.original_transaction_id ?? latest.transaction_id;
  const expiresMs = latest.expires_date_ms ? Number(latest.expires_date_ms) : null;

  // Reject expired subscriptions. Lifetime products have no expires_date_ms.
  if (expiresMs && expiresMs < Date.now()) {
    return { valid: false, transactionId, currentPeriodEnd: new Date(expiresMs), rawResponse: raw };
  }

  const currentPeriodEnd = expiresMs ? new Date(expiresMs) : null;
  return { valid: true, transactionId, currentPeriodEnd, rawResponse: raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// Android — Google Play Developer API verification
// Docs: https://developers.google.com/android-publisher/api-ref/rest/v3
// ─────────────────────────────────────────────────────────────────────────────

async function getGoogleAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is not set. " +
        "Create a service account in Google Cloud Console with the 'Android Publisher' role " +
        "and store the JSON key as a single-line environment variable.",
    );
  }

  const key = JSON.parse(keyJson) as {
    client_email: string;
    private_key: string;
    token_uri: string;
  };

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

async function verifyAndroid(
  purchaseToken: string,
  productId: string,
  purchaseType: "lifetime" | "subscription",
): Promise<{
  valid: boolean;
  transactionId: string;
  currentPeriodEnd: Date | null;
  rawResponse: string;
}> {
  const packageName = "com.themuslimman.seerah";
  const accessToken = await getGoogleAccessToken();

  let url: string;
  if (purchaseType === "subscription") {
    // subscriptionsv2 is the current recommended API for subscription verification.
    url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
  } else {
    url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await res.json()) as Record<string, unknown>;
  const raw = JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES);

  if (!res.ok) {
    return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw };
  }

  if (purchaseType === "subscription") {
    // subscriptionsv2 subscriptionState values:
    //   SUBSCRIPTION_STATE_ACTIVE          — active and billing
    //   SUBSCRIPTION_STATE_IN_GRACE_PERIOD — billing failed but grace period active
    //   SUBSCRIPTION_STATE_ON_HOLD         — billing suspended (do not grant access)
    //   SUBSCRIPTION_STATE_PAUSED          — user paused (do not grant access)
    //   SUBSCRIPTION_STATE_CANCELED        — cancelled (do not grant access)
    //   SUBSCRIPTION_STATE_EXPIRED         — expired (do not grant access)
    const subState = data.subscriptionState as string | undefined;
    const isValid =
      subState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD";

    if (!isValid) {
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw };
    }

    const lineItems =
      (data.lineItems as Array<{ expiryTime?: string; productId: string }>) ?? [];
    const item =
      lineItems.find((l) => l.productId === productId) ?? lineItems[0];
    const expiryTime = item?.expiryTime ? new Date(item.expiryTime) : null;

    // Verify the subscription has not already expired.
    if (expiryTime && expiryTime < new Date()) {
      return { valid: false, transactionId: "", currentPeriodEnd: expiryTime, rawResponse: raw };
    }

    const latestOrderId = (data.latestOrderId as string) ?? purchaseToken;
    return { valid: true, transactionId: latestOrderId, currentPeriodEnd: expiryTime, rawResponse: raw };
  } else {
    // products.get response:
    //   purchaseState 0 = Purchased, 1 = Cancelled, 2 = Pending
    const purchaseState = data.purchaseState as number | undefined;
    if (purchaseState !== 0) {
      return { valid: false, transactionId: "", currentPeriodEnd: null, rawResponse: raw };
    }
    const orderId = data.orderId as string;
    return { valid: true, transactionId: orderId, currentPeriodEnd: null, rawResponse: raw };
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
 *   { platform: "google", productId: string, purchaseToken: string, orderId: string }
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
  const rl = checkRateLimit(`mobile-verify:${ip}`, 10, 5 * 60 * 1000);
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

  const { platform, productId, receiptData, purchaseToken, orderId } = body;

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
    };

    if (platform === "apple") {
      if (!receiptData)
        return NextResponse.json({ error: "receiptData is required for iOS" }, { status: 400 });
      verification = await verifyApple(receiptData, productId);
    } else if (platform === "google") {
      if (!purchaseToken)
        return NextResponse.json({ error: "purchaseToken is required for Android" }, { status: 400 });
      verification = await verifyAndroid(purchaseToken, productId, meta.purchaseType);
      if (!verification.transactionId && orderId) verification.transactionId = orderId;
    } else {
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
    }

    if (!verification.valid) {
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
    const existing = await prisma.mobilePurchase.findUnique({
      where: { transactionId: verification.transactionId },
      select: { userId: true, user: { select: { isAnonymous: true } } },
    });
    if (existing && existing.userId !== user.id) {
      if (!existing.user.isAnonymous) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This transaction is already linked to a different account. " +
              "Contact support@themuslimman.com if you believe this is an error.",
          },
          { status: 409 },
        );
      }
      console.log(
        `[mobile-purchases/verify] Re-linking transaction ${verification.transactionId} ` +
          `from abandoned guest account ${existing.userId} to ${user.id}`,
      );
    }

    // Upsert the MobilePurchase record — idempotent for the same user.
    await prisma.mobilePurchase.upsert({
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
        updatedAt: new Date(),
      },
      update: {
        // Re-verification refreshes the record for subscription renewals.
        // userId is included so re-linking an abandoned guest account's
        // purchase (see re-link comment above) actually takes effect.
        userId: user.id,
        status: "active",
        currentPeriodEnd: verification.currentPeriodEnd,
        rawResponse: verification.rawResponse,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update user.planType to family if this is a family purchase.
    if (meta.planType === "family" && user.planType !== "family") {
      await prisma.user.update({ where: { id: user.id }, data: { planType: "family" } });
    }

    const hasAccess = await hasActiveCourseAccess(user.id);
    return NextResponse.json({ success: true, hasAccess });
  } catch (err) {
    console.error("[mobile-purchases/verify]", err);
    return NextResponse.json(
      { success: false, error: "Purchase verification failed. Please try again." },
      { status: 500 }
    );
  }
}
