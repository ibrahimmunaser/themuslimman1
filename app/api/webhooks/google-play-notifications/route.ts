import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { fetchAndroidSubscriptionV2, fetchAndroidProduct, ANDROID_PACKAGE_NAME } from "@/lib/google-play";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { clearHasPaidIfNoOtherLifetimeEvidence } from "@/lib/access";

/**
 * POST /api/webhooks/google-play-notifications
 *
 * Google Play Real-time Developer Notifications (RTDN), delivered via a
 * Cloud Pub/Sub push subscription. Setup required in two places (external —
 * cannot be done from this codebase):
 *   1. Google Cloud Console: create a Pub/Sub topic, grant Publish access to
 *      the well-known service account `google-play-developer-notifications@
 *      system.gserviceaccount.com`, then create a PUSH subscription on that
 *      topic pointing at:
 *        https://themuslimman.com/api/webhooks/google-play-notifications?secret=<GOOGLE_RTDN_WEBHOOK_SECRET>
 *   2. Play Console → Monetization setup → Real-time developer notifications
 *      → paste the same topic name (projects/<project>/topics/<topic>).
 *
 * Same rationale as /api/webhooks/apple-notifications (Audit H8): the
 * client-driven /api/mobile-purchases/verify path only refreshes state when
 * the app is open and re-verifies. A subscription revoked/refunded (or a
 * lifetime purchase refunded — SUBSCRIPTION_REVOKED / ONE_TIME_PRODUCT_CANCELED)
 * while the app is closed previously never reached the server at all.
 *
 * Authentication: Pub/Sub push requests aren't otherwise authenticated by
 * default, so a shared secret query-string token (set on the push
 * subscription's endpoint URL and compared here) stands in for the OIDC
 * verification Pub/Sub also supports — simple and sufficient since this
 * endpoint only ever triggers a re-fetch from Google's own API, never trusts
 * notification payload fields directly for anything security-sensitive.
 */

const MAX_RAW_RESPONSE_BYTES = 4096;

// https://developers.google.com/android-publisher/rtdn-reference#SubscriptionNotificationType
const SUB_NOTIFICATION_REVOKED = 12;

// https://developers.google.com/android-publisher/rtdn-reference#one-time-product-notification-type
const ONE_TIME_PRODUCT_CANCELED = 2;

interface DeveloperNotification {
  packageName?: string;
  subscriptionNotification?: { notificationType: number; purchaseToken: string; subscriptionId: string };
  oneTimeProductNotification?: { notificationType: number; purchaseToken: string; sku: string };
  testNotification?: { version: string };
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const secret = process.env.GOOGLE_RTDN_WEBHOOK_SECRET;
  // Audit C1 fix: this endpoint used to fail OPEN when the secret env var
  // was unset — anyone who discovered the URL could POST arbitrary
  // subscriptionNotification/oneTimeProductNotification payloads and force
  // a live re-fetch (and resulting refunded/active status write) for any
  // purchaseToken they cared to guess or had observed elsewhere. This
  // endpoint is only ever reachable from a Pub/Sub push subscription that
  // WE configure with this exact secret in the URL (see the setup docs
  // above), so a missing secret is always a deployment misconfiguration,
  // never a legitimate "no auth needed" state. Fail closed instead — an
  // unset secret makes the endpoint fully return 503 rather than silently
  // trusting whatever hits it.
  if (!secret) {
    console.error("[google-play-notifications] GOOGLE_RTDN_WEBHOOK_SECRET is not set — rejecting all requests");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const provided = req.nextUrl.searchParams.get("secret") ?? "";
  if (!provided || !timingSafeEqualStr(provided, secret)) {
    console.warn("[google-play-notifications] Rejected request with missing/invalid secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Audit M3 fix: even with the shared secret above, this endpoint had no
  // rate limit — a leaked/guessed secret (or Pub/Sub misconfiguration
  // replaying deliveries) could otherwise drive unbounded Google Play API
  // calls (each notification triggers a live fetchAndroidSubscriptionV2/
  // fetchAndroidProduct call) and unbounded database writes. Keyed on IP
  // rather than per-purchaseToken since Pub/Sub's own push requests all
  // originate from Google's infrastructure IP ranges, not end-user devices.
  const ip = getIP(req);
  const rl = await checkRateLimit(`google-play-rtdn:${ip}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let envelope: { message?: { data?: string } };
  try {
    envelope = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dataB64 = envelope.message?.data;
  if (!dataB64) {
    return NextResponse.json({ error: "Missing Pub/Sub message.data" }, { status: 400 });
  }

  let notification: DeveloperNotification;
  try {
    notification = JSON.parse(Buffer.from(dataB64, "base64").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Malformed message.data" }, { status: 400 });
  }

  if (notification.testNotification) {
    console.log("[google-play-notifications] Received test notification (Play Console RTDN setup)");
    return NextResponse.json({ received: true });
  }

  // Audit M8 / follow-up: require packageName and it must match THIS app.
  // Previously a missing packageName was silently accepted, so a leaked
  // ?secret= plus a crafted payload without packageName could still drive
  // live Play API lookups + DB writes. Real Google RTDN always includes it.
  if (!notification.packageName || notification.packageName !== ANDROID_PACKAGE_NAME) {
    console.warn(
      `[google-play-notifications] packageName missing or mismatched: got "${notification.packageName ?? ""}", expected "${ANDROID_PACKAGE_NAME}" — ignoring`,
    );
    return NextResponse.json({ received: true });
  }

  // Audit H1-followup fix: this used to unconditionally return 200 even when
  // the live Play API re-fetch below failed (network error, 5xx, rate
  // limit) — Pub/Sub only retries on a non-2xx response, so a transient
  // failure right when Google delivers a REVOKED/CANCELED notification
  // silently and PERMANENTLy dropped it: no retry, no re-delivery, no
  // record anywhere that a refund/revocation was ever missed. `handled`
  // distinguishes "processed (or legitimately nothing to do)" from "a
  // transient failure occurred — ask Pub/Sub to redeliver".
  let handled = true;
  if (notification.subscriptionNotification) {
    const { notificationType, purchaseToken } = notification.subscriptionNotification;
    handled = await handleSubscriptionNotification(notificationType, purchaseToken);
  } else if (notification.oneTimeProductNotification) {
    const { notificationType, purchaseToken, sku } = notification.oneTimeProductNotification;
    handled = await handleOneTimeProductNotification(notificationType, purchaseToken, sku);
  } else {
    console.log("[google-play-notifications] Notification with no recognized payload shape — ignoring");
  }

  if (!handled) {
    return NextResponse.json({ error: "Upstream verification failed, please retry" }, { status: 502 });
  }

  return NextResponse.json({ received: true });
}

/** Returns false only for a transient failure that's worth Pub/Sub retrying. */
async function handleSubscriptionNotification(notificationType: number, purchaseToken: string): Promise<boolean> {
  const existing = await prisma.mobilePurchase.findFirst({
    where: { purchaseToken, platform: "google" },
    // Deterministic when legacy duplicate tokens exist (renewal used to mint
    // a new transactionId/row per cycle) — prefer the most recently verified.
    orderBy: { verifiedAt: "desc" },
    select: { id: true, userId: true, productId: true },
  });
  if (!existing) {
    console.log(`[google-play-notifications] No MobilePurchase row for purchaseToken (subscription notificationType=${notificationType})`);
    return true;
  }

  // Never trust the notification's own type for the actual new state — fetch
  // the authoritative current status from the Play Developer API (Google's
  // own recommendation), same source of truth /api/mobile-purchases/verify
  // already uses for this exact purchaseToken.
  let ok: boolean, status: number, data: Record<string, unknown>;
  try {
    ({ ok, status, data } = await fetchAndroidSubscriptionV2(purchaseToken));
  } catch (e) {
    console.error("[google-play-notifications] fetchAndroidSubscriptionV2 failed:", e);
    return false;
  }
  if (!ok) {
    console.error("[google-play-notifications] Play API error fetching subscription state:", JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES));
    // 4xx (other than 429) means Google will never accept this lookup no
    // matter how many times we retry (e.g. malformed/dead token) — only
    // rate-limit and server errors are worth asking Pub/Sub to redeliver.
    return status === 429 || status >= 500;
  }

  const subState = data.subscriptionState as string | undefined;
  // Audit C1 fix: SUBSCRIPTION_STATE_CANCELED means auto-renew is off but the
  // user is STILL entitled until expiryTime — same as Stripe cancel_at_period_end
  // and Apple (expiresDate still in the future). Previously we treated CANCELED
  // as immediately expired, cutting paid access early. Keep status="active" with
  // currentPeriodEnd set so hasActiveCourseAccess keeps granting until expiry;
  // a later EXPIRED notification (or natural period end) flips it off.
  const lineItems = (data.lineItems as Array<{ expiryTime?: string; productId?: string }>) ?? [];
  const matchedBySku = lineItems.find((l) => l.productId && l.productId === existing.productId);
  // Never silently use lineItems[0] when the stored SKU is missing from the
  // payload — that can refresh expiry/productId for the wrong plan.
  const matchedItem = matchedBySku ?? (lineItems.length === 1 ? lineItems[0] : undefined);
  const expiryTime = matchedItem?.expiryTime ? new Date(matchedItem.expiryTime) : null;
  const now = new Date();
  const stillEntitled =
    (subState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
      subState === "SUBSCRIPTION_STATE_CANCELED") &&
    !!expiryTime &&
    expiryTime >= now;

  // Refuse to wipe a previously valid periodEnd when Play omits expiryTime
  // (contradicts verify's refuse-null rule). Leave the row unchanged.
  if (
    (subState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
      subState === "SUBSCRIPTION_STATE_CANCELED") &&
    !expiryTime
  ) {
    console.warn(
      `[google-play-notifications] Skipping update: entitled state ${subState} with null expiryTime for purchase ${existing.id}`,
    );
    return true;
  }

  // Audit H1 fix: previously `isRevoked = notificationType === SUB_NOTIFICATION_REVOKED`
  // was given priority over the live entitlement check (a REVOKED notification
  // unconditionally forced status="refunded" and wiped currentPeriodEnd, even
  // if the live Play API says the subscription is still entitled).
  // notificationType is delivered as unauthenticated content over Pub/Sub —
  // Google's own guidance is to treat it only as a hint to re-fetch, never as
  // the source of truth. The live subState + expiryTime now always win for
  // whether access should be granted; notificationType is only consulted (as a
  // secondary signal) to decide whether a lapse should be recorded as
  // "refunded" (clears hasPaid for lifetime-equivalent bookkeeping) vs. an
  // ordinary "expired".
  const notificationClaimsRevoked = notificationType === SUB_NOTIFICATION_REVOKED;
  const isRevoked = !stillEntitled && notificationClaimsRevoked;
  // ON_HOLD / PAUSED: no access, but Play can still resume billing — keep
  // status="active" with a past currentPeriodEnd so account-delete still
  // finds and cancels the Play sub (query is status:"active"), while
  // hasActiveCourseAccess (needs currentPeriodEnd >= now) denies access.
  const isHoldOrPaused =
    subState === "SUBSCRIPTION_STATE_ON_HOLD" ||
    subState === "SUBSCRIPTION_STATE_PAUSED";

  const newStatus = stillEntitled
    ? "active"
    : isRevoked
      ? "refunded"
      : isHoldOrPaused
        ? "active"
        : "expired";
  const periodEnd = stillEntitled
    ? expiryTime
    : isHoldOrPaused
      ? (expiryTime && expiryTime < now ? expiryTime : new Date(0))
      : newStatus === "refunded"
        ? null
        : expiryTime;
  // Keep productId fresh if Play reports a different SKU on the same token
  // (plan change) — feeds account-delete cancel + acknowledge paths (Audit H1).
  // Only accept a matched line item (never silent lineItems[0] fallback when
  // the stored productId is missing from the payload — that can retarget cancel).
  const freshProductId =
    typeof matchedItem?.productId === "string" && matchedItem.productId.length > 0
      ? matchedItem.productId
      : undefined;
  await prisma.mobilePurchase.update({
    where: { id: existing.id },
    data: {
      status: newStatus,
      currentPeriodEnd: newStatus === "refunded" ? null : periodEnd,
      ...(freshProductId && freshProductId !== existing.productId
        ? { productId: freshProductId }
        : {}),
      rawResponse: JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES),
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(
    `[google-play-notifications] subscriptionNotificationType=${notificationType} subscriptionState=${subState} -> status=${newStatus} userId=${existing.userId}`,
  );
  return true;
}

/** Returns false only for a transient failure that's worth Pub/Sub retrying. */
async function handleOneTimeProductNotification(notificationType: number, purchaseToken: string, sku: string): Promise<boolean> {
  if (notificationType !== ONE_TIME_PRODUCT_CANCELED) {
    // ONE_TIME_PRODUCT_PURCHASED (1) — the client's own post-purchase call to
    // /api/mobile-purchases/verify already handles initial verification;
    // nothing additional to do here.
    return true;
  }

  const existing = await prisma.mobilePurchase.findFirst({
    where: { purchaseToken, platform: "google" },
    orderBy: { verifiedAt: "desc" },
    select: { id: true, userId: true, purchaseType: true, productId: true },
  });
  if (!existing) {
    console.log("[google-play-notifications] No MobilePurchase row for purchaseToken (one-time product canceled)");
    return true;
  }

  // Audit H1 fix: previously this marked the purchase "refunded" purely
  // because notificationType said ONE_TIME_PRODUCT_CANCELED (2), with zero
  // live verification — unlike the subscription path just above, which
  // already re-fetches from the Play API. Same rationale applies: Pub/Sub
  // notification payload fields are a hint to re-check, not a source of
  // truth. Google Play's products.get purchaseState is the authoritative
  // signal (0 = Purchased, 1 = Canceled, 2 = Pending).
  let ok: boolean, status: number, data: Record<string, unknown>;
  try {
    ({ ok, status, data } = await fetchAndroidProduct(purchaseToken, sku || existing.productId));
  } catch (e) {
    console.error("[google-play-notifications] fetchAndroidProduct failed:", e);
    return false;
  }
  if (!ok) {
    console.error(
      "[google-play-notifications] Play API error fetching product state:",
      JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES),
    );
    return status === 429 || status >= 500;
  }
  const purchaseState = data.purchaseState as number | undefined;
  if (purchaseState !== 1) {
    console.warn(
      `[google-play-notifications] ONE_TIME_PRODUCT_CANCELED notification received but live ` +
        `purchaseState=${purchaseState} does not confirm cancellation — ignoring (userId=${existing.userId})`,
    );
    return true;
  }

  await prisma.mobilePurchase.update({
    where: { id: existing.id },
    data: {
      status: "refunded",
      currentPeriodEnd: null,
      rawResponse: JSON.stringify(data).slice(0, MAX_RAW_RESPONSE_BYTES),
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`[google-play-notifications] ONE_TIME_PRODUCT_CANCELED (confirmed live) -> status=refunded userId=${existing.userId}`);

  if (existing.purchaseType === "lifetime") {
    await clearHasPaidIfNoOtherLifetimeEvidence(existing.userId, existing.id, "google-play-notifications");
  }
  return true;
}
