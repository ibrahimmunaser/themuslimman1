import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAppleJwsChainAndDecode } from "@/lib/apple-jws";
import { clearHasPaidIfNoOtherLifetimeEvidence } from "@/lib/access";

/**
 * POST /api/webhooks/apple-notifications
 *
 * App Store Server Notifications V2 endpoint. Configure this URL in
 * App Store Connect → Apps → [App] → App Information → App Store Server
 * Notifications (both Production and Sandbox URLs — Apple sends both).
 *
 * ── Why this exists (Audit H8) ──
 * /api/mobile-purchases/verify only ever runs when the CLIENT actively
 * re-verifies a receipt/transaction. Apple already documented this exact gap
 * as a known limitation in lib/access.ts: refunds, chargebacks, and Family
 * Sharing revocations that happen while the app isn't open/reverifying were
 * never reflected server-side — a refunded user (or a family member removed
 * from Family Sharing) kept full course access indefinitely. This endpoint
 * is Apple's real-time push notification for exactly those events, so
 * access can be revoked the moment Apple tells us about it instead of never.
 *
 * Authentication: there is no shared secret — the JWS signature itself
 * (verified via verifyAppleJwsChainAndDecode against Apple's pinned Root CA)
 * IS the authentication. See lib/apple-jws.ts.
 *
 * Apple requires a 200 response within a few seconds or it will retry with
 * exponential backoff for up to ~24 hours — always return 200 once the
 * payload is at least readable, even for notification types we don't act on,
 * so Apple doesn't keep hammering a permanently-ignored notification.
 */

const APPLE_BUNDLE_ID = "com.themuslimman.seerah";
const MAX_RAW_RESPONSE_BYTES = 4096;

// Notification types that mean "revoke access immediately" — Apple only
// sends these when money has actually been returned or Family Sharing
// access was pulled, so we don't wait for currentPeriodEnd to lapse.
const REVOKE_TYPES = new Set(["REFUND", "REVOKE"]);
// Subscription lifecycle end states with no refund involved.
const EXPIRE_TYPES = new Set(["EXPIRED", "GRACE_PERIOD_EXPIRED"]);
// Renewal/(re)activation events — refresh status + currentPeriodEnd. This
// also closes the "renewal happened while app was closed" staleness gap
// documented in lib/access.ts as a side benefit.
const RENEW_TYPES = new Set(["SUBSCRIBED", "DID_RENEW", "RENEWAL_EXTENDED"]);

export async function POST(req: NextRequest) {
  let body: { signedPayload?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.signedPayload) {
    return NextResponse.json({ error: "Missing signedPayload" }, { status: 400 });
  }

  let notification: Record<string, unknown>;
  try {
    notification = await verifyAppleJwsChainAndDecode(body.signedPayload);
  } catch (e) {
    console.error("[apple-notifications] signedPayload verification failed:", e);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const notificationType = String(notification.notificationType ?? "");
  const subtype = notification.subtype ? String(notification.subtype) : null;
  const data = notification.data as Record<string, unknown> | undefined;

  if (notificationType === "TEST") {
    console.log("[apple-notifications] Received TEST notification (App Store Connect 'Send Test Notification')");
    return NextResponse.json({ received: true });
  }

  if (!data || data.bundleId !== APPLE_BUNDLE_ID) {
    console.warn(`[apple-notifications] Ignoring notification for unrelated bundleId=${data?.bundleId}`);
    return NextResponse.json({ received: true });
  }

  const signedTransactionInfo = data.signedTransactionInfo;
  if (typeof signedTransactionInfo !== "string") {
    console.log(`[apple-notifications] notificationType=${notificationType} subtype=${subtype} has no transaction payload — nothing to update`);
    return NextResponse.json({ received: true });
  }

  let transaction: Record<string, unknown>;
  try {
    transaction = await verifyAppleJwsChainAndDecode(signedTransactionInfo);
  } catch (e) {
    console.error("[apple-notifications] signedTransactionInfo verification failed:", e);
    return NextResponse.json({ received: true });
  }

  const transactionId = String(transaction.originalTransactionId ?? transaction.transactionId ?? "");
  if (!transactionId) {
    console.warn(`[apple-notifications] notificationType=${notificationType} transaction payload had no transactionId`);
    return NextResponse.json({ received: true });
  }

  const isRevoked = REVOKE_TYPES.has(notificationType) || transaction.revocationDate != null;
  const isExpired = !isRevoked && EXPIRE_TYPES.has(notificationType);
  const isRenewed = !isRevoked && !isExpired && RENEW_TYPES.has(notificationType);

  const newStatus = isRevoked ? "refunded" : isExpired ? "expired" : isRenewed ? "active" : null;
  if (!newStatus) {
    // e.g. DID_CHANGE_RENEWAL_STATUS, PRICE_INCREASE, DID_FAIL_TO_RENEW
    // (billing-retry grace period — Apple keeps the subscription "active" on
    // their end during this window, no local status flip needed), CONSUMPTION_REQUEST.
    console.log(`[apple-notifications] notificationType=${notificationType} subtype=${subtype} — no status change needed (transactionId=${transactionId})`);
    return NextResponse.json({ received: true });
  }

  const expiresMs = typeof transaction.expiresDate === "number" ? transaction.expiresDate : null;
  const rawResponse = JSON.stringify(transaction).slice(0, MAX_RAW_RESPONSE_BYTES);

  const existing = await prisma.mobilePurchase.findFirst({
    where: { transactionId, platform: "apple" },
    select: { id: true, userId: true, purchaseType: true },
  });
  if (!existing) {
    // Nothing to revoke — most likely a transaction that was never
    // successfully verified/recorded in the first place (e.g. the app was
    // never opened after purchase). Nothing more to do.
    console.log(`[apple-notifications] No MobilePurchase row for transactionId=${transactionId} (notificationType=${notificationType})`);
    return NextResponse.json({ received: true });
  }

  await prisma.mobilePurchase.update({
    where: { id: existing.id },
    data: {
      status: newStatus,
      // A REFUND/REVOKE means access should end NOW regardless of whatever
      // expiresDate the (possibly stale) embedded transaction payload still
      // shows — don't let a future currentPeriodEnd re-grant access via the
      // subscription branch of hasActiveCourseAccess.
      currentPeriodEnd: newStatus === "refunded" ? null : expiresMs ? new Date(expiresMs) : undefined,
      rawResponse,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(
    `[apple-notifications] ${notificationType}${subtype ? `/${subtype}` : ""} -> status=${newStatus} ` +
      `transactionId=${transactionId} userId=${existing.userId}`,
  );

  // Lifetime purchases also flip user.hasPaid=true at verification time
  // (see /api/mobile-purchases/verify), which short-circuits
  // hasActiveCourseAccess independently of MobilePurchase.status. On
  // revocation, only clear it if the user has no OTHER legitimate lifetime
  // evidence (a separate Stripe purchase, or another still-active mobile
  // lifetime purchase) — never blindly strip access a paying Stripe
  // customer earned through a completely different purchase.
  if (newStatus === "refunded" && existing.purchaseType === "lifetime") {
    await clearHasPaidIfNoOtherLifetimeEvidence(existing.userId, existing.id, "apple-notifications");
  }

  return NextResponse.json({ received: true });
}
