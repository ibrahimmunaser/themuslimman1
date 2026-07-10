import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { hashToken } from "@/lib/hash-token";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

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
 *  1. Cancel any active Stripe subscription immediately (best-effort).
 *  2. Detach (not delete) rows that are analytics/audit records referencing
 *     this user without an owning relationship (ActivityLog, GiftPurchase),
 *     so the hard delete below doesn't fail on a FK constraint.
 *  3. Hard-delete the User row — cascades remove Session, MobilePurchase,
 *     Purchase, Subscription, StudentProfile (+ its children), LearnerProfile
 *     (+ its children), StudySession, PartProgress, EmailAutomationEvent.
 *  4. Clear the session cookie.
 *
 * Responses:
 *  200 { success: true }
 *  400 { error }        — wrong/missing password
 *  401                    — not authenticated
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`account-delete:${ip}`, 5, 15 * 60 * 1000);
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

    // Cancel any active Stripe subscription immediately, before deleting the
    // DB rows that record it. Best-effort — proceed with deletion regardless.
    const activeSubs = await prisma.subscription.findMany({
      where: { userId: dbUser.id, status: { in: ["active", "trialing", "past_due"] } },
      select: { stripeSubscriptionId: true },
    });
    for (const sub of activeSubs) {
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (e) {
        console.warn(`[ACCOUNT_DELETE] Could not cancel subscription ${sub.stripeSubscriptionId}:`, e);
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
