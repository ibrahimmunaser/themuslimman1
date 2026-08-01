import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { hashToken } from "@/lib/hash-token";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { cancelAndroidSubscription } from "@/lib/google-play";

/**
 * POST /api/account/delete
 *
 * Self-service, immediate, in-app account deletion — Apple Guideline
 * 5.1.1(v) requires apps that support account creation to also offer
 * account deletion (not just deactivation), completing fully in-app.
 *
 * Body: { password?: string } — required only if the account has a
 * password set (guest/mobile-anonymous accounts have none, so no
 * confirmation beyond the client-side confirmation dialog is needed).
 *
 * Steps:
 *  1. Cancel any active Stripe subscription immediately (blocking).
 *  2. Cancel any active Google Play subscription so it stops renewing
 *     (blocking) — without this, deleting the account only wiped the local
 *     MobilePurchase row while Google kept charging the user's Play account
 *     every period with no in-app record left anywhere to even show them
 *     what's still being billed. Apple has no equivalent server-side
 *     cancellation API at all (by design — Apple, not the developer, owns
 *     subscription billing), so an active Apple subscription is left alone
 *     here; the client shows a warning before deletion telling iOS users to
 *     also cancel via Settings, matching what both platforms' account
 *     deletion guidelines (Apple 5.1.1(v), Play User Data policy) require.
 *  3. Detach (not delete) rows that are analytics/audit records referencing
 *     this user without an owning relationship (ActivityLog, GiftPurchase),
 *     so the hard delete below doesn't fail on a FK constraint.
 *  4. Hard-delete the User row — cascades remove Session, MobilePurchase,
 *     Purchase, Subscription, StudentProfile (+ its children), LearnerProfile
 *     (+ its children), StudySession, PartProgress, EmailAutomationEvent.
 *  5. Clear the session cookie.
 *
 * Responses:
 *  200 { success: true }
 *  400 { error }        — wrong/missing password
 *  401                    — not authenticated
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`account-delete:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true, stripeCustomerId: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Only require password confirmation when the account actually has one
    // (real accounts). Guest/mobile-anonymous accounts have no password —
    // the client-side confirmation dialog is the only gate for those.
    if (dbUser.passwordHash) {
      let body: { password?: string } = {};
      try {
        body = await request.json();
      } catch {
        // no body sent
      }
      const password = body.password ?? "";
      const valid = password
        ? await bcrypt.compare(password, dbUser.passwordHash)
        : false;
      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password. Please confirm your password to delete your account." },
          { status: 400 },
        );
      }
    }

    // Cancel any active Stripe subscription BEFORE deleting the DB rows that
    // record it. This must not be "best-effort, delete regardless": if
    // cancellation fails and we still hard-delete the Subscription row, the
    // subscription keeps renewing/billing in Stripe forever with no record
    // left anywhere in this system to find and cancel it (no
    // stripeSubscriptionId, no stripeCustomerId — both gone with the user
    // row). So a failed cancellation now blocks deletion entirely and asks
    // the user to retry, instead of silently orphaning live billing.
    const activeSubs = await prisma.subscription.findMany({
      where: { userId: dbUser.id, status: { in: ["active", "trialing", "past_due"] } },
      select: { stripeSubscriptionId: true },
    });
    for (const sub of activeSubs) {
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (e) {
        console.error(`[ACCOUNT_DELETE] Could not cancel subscription ${sub.stripeSubscriptionId}:`, e);
        return NextResponse.json(
          {
            error:
              "Could not cancel your active subscription. Your account was NOT deleted so you " +
              "are not left being billed with no record of it. Please try again in a moment, or " +
              "contact support@themuslimman.com if this keeps happening.",
          },
          { status: 502 },
        );
      }
    }

    // Same reasoning as the Stripe block above, for Google Play. Apple
    // subscriptions are deliberately skipped — Apple provides no server-side
    // subscription cancellation API at all, so there's nothing to call here;
    // the client warns iOS users up front that they must cancel via Settings.
    const activeGoogleSubs = await prisma.mobilePurchase.findMany({
      where: {
        userId: dbUser.id,
        platform: "google",
        purchaseType: "subscription",
        // Include any row that could still bill: ON_HOLD is kept status=active
        // with a past periodEnd; also catch mislabeled non-refunded rows that
        // still have a purchaseToken (webhook lag / old bugs).
        status: { notIn: ["refunded"] },
        purchaseToken: { not: null },
      },
      select: { purchaseToken: true, productId: true, transactionId: true, status: true },
    });
    // Prefer canceling "active" first; still attempt others with a token.
    const orderedGoogleSubs = [
      ...activeGoogleSubs.filter((s) => s.status === "active"),
      ...activeGoogleSubs.filter((s) => s.status !== "active"),
    ];
    for (const sub of orderedGoogleSubs) {
      if (!sub.purchaseToken) {
        // Audit H1: previously `continue` silently skipped — account deleted
        // while an "active" Google sub with a missing token kept renewing.
        console.error(
          `[ACCOUNT_DELETE] Active Google sub ${sub.transactionId} has no purchaseToken — refusing delete`,
        );
        return NextResponse.json(
          {
            error:
              "Could not cancel your active Google Play subscription (missing purchase token). " +
              "Your account was NOT deleted. Please contact support@themuslimman.com.",
          },
          { status: 502 },
        );
      }
      try {
        const result = await cancelAndroidSubscription(sub.purchaseToken, sub.productId);
        if (!result.ok) {
          throw new Error(`Play cancel returned status ${result.status}`);
        }
      } catch (e) {
        console.error(`[ACCOUNT_DELETE] Could not cancel Play subscription ${sub.transactionId}:`, e);
        return NextResponse.json(
          {
            error:
              "Could not cancel your active Google Play subscription. Your account was NOT deleted " +
              "so you are not left being billed with no record of it. Please try again in a moment, " +
              "or contact support@themuslimman.com if this keeps happening.",
          },
          { status: 502 },
        );
      }
    }

    await prisma.$transaction([
      // These reference the user without an owning cascade relationship —
      // detach so the hard delete below doesn't hit a FK constraint.
      prisma.activityLog.updateMany({ where: { userId: dbUser.id }, data: { userId: null } }),
      prisma.giftPurchase.updateMany({
        where: { purchaserUserId: dbUser.id },
        data: { purchaserUserId: null },
      }),
      prisma.giftPurchase.updateMany({
        where: { claimedByUserId: dbUser.id },
        data: { claimedByUserId: null },
      }),
      // TrialEligibility.userId has no @relation/FK to User at all (it's a
      // bare String column), so Postgres cascade can't clean these up —
      // delete them explicitly or they'd be permanently orphaned rows
      // referencing a userId that no longer exists.
      prisma.trialEligibility.deleteMany({ where: { userId: dbUser.id } }),
      prisma.user.delete({ where: { id: dbUser.id } }),
    ]);

    const cookieStore = await cookies();
    const token = cookieStore.get("seerah_session")?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token: hashToken(token) } }).catch(() => {});
    }
    cookieStore.delete("seerah_session");
    cookieStore.delete("seerah_role");
    cookieStore.delete("seerah_profile");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACCOUNT_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Could not delete account. Please try again or contact support@themuslimman.com." },
      { status: 500 },
    );
  }
}
