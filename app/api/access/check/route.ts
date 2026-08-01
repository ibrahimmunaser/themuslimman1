import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";

/**
 * GET /api/access/check
 *
 * Unified access check for web and mobile clients.
 * Covers Stripe purchases, Stripe subscriptions, Apple IAP, and Google Play IAP.
 *
 * Returns:
 *   { hasAccess, isFamily, planType, emailVerified, isAnonymous, purchasePlatform }
 *   401 — not authenticated
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const access = await getUserAccessInfo(user.id, user.hasPaid);
  const planType = user.planType === "family" ? "family" : "individual";

  return NextResponse.json(
    {
      hasAccess: access.hasAccess,
      isFamily: planType === "family",
      planType,
      // Audit M-resend-verify: the mobile app polls this endpoint far more
      // often than it calls /api/auth/signin or /api/auth/mobile-anonymous
      // (every app resume, every purchase), so it's the most reliable place
      // for the client's cached emailVerified flag to get refreshed — e.g.
      // after the user verifies in a browser tab opened from the app.
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      // "stripe" | "google" | "apple" | null (null = no active access, or a
      // legacy hasPaid grant with no traceable purchase row). Lets the client
      // route "Manage Subscription" to the RIGHT place — a Google Play
      // purchaser tapping that button on Android must land in the Play Store
      // subscription center, never Stripe's web billing portal (and vice
      // versa for Apple/iOS, per Guideline 3.1.1) — instead of guessing
      // purely from what platform the app happens to be running on today.
      purchasePlatform: access.purchasePlatform,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache" },
    },
  );
}
