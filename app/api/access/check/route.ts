import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { getSubscriptionDisplayAmountCents } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe-config";

/**
 * GET /api/access/check
 *
 * Unified access check for web and mobile clients.
 * Covers Stripe purchases, Stripe subscriptions, Apple IAP, and Google Play IAP.
 *
 * Returns:
 *   { hasAccess, isFamily, planType, emailVerified, isAnonymous, purchasePlatform,
 *     plan: { interval, amountCents, currency, renewsAt, cancelAtPeriodEnd } }
 *   401 — not authenticated
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const access = await getUserAccessInfo(user.id, user.hasPaid);
  const planType = user.planType === "family" ? "family" : "individual";

  // Mobile/Account UI "Current Plan" card (requested so both individual and
  // family customers can see what plan they're on and what it costs) —
  // computed only from data access.ts already fetches, plus one Stripe
  // price lookup for an active monthly sub (mirrors app/billing/page.tsx's
  // own individualMonthlyDisplayCents logic, which already needs this for
  // the same reason: the public monthly price can change over time without
  // touching what an existing subscriber's Stripe subscription actually
  // charges).
  //
  // Apple/Google IAP never reports the exact amount actually charged to this
  // server (receipts only confirm product/validity, not price — see
  // app/api/mobile-purchases/verify/route.ts), and regional App Store/Play
  // Store pricing can differ from the US price used here, so amountCents is
  // deliberately left null for IAP rather than guessing — the client falls
  // back to directing the user to their store's own subscription page for
  // the exact figure, per Guideline 3.1.1.
  let plan: {
    interval: "lifetime" | "monthly" | null;
    amountCents: number | null;
    currency: string | null;
    renewsAt: string | null;
    cancelAtPeriodEnd: boolean | null;
  } = { interval: null, amountCents: null, currency: null, renewsAt: null, cancelAtPeriodEnd: null };

  if (access.hasLifetime) {
    if (access.lifetimePurchase) {
      plan = {
        interval: "lifetime",
        amountCents: access.lifetimePurchase.amount,
        currency: access.lifetimePurchase.currency,
        renewsAt: null,
        cancelAtPeriodEnd: null,
      };
    } else {
      // Mobile lifetime IAP, or a legacy hasPaid grant with no Purchase row.
      plan = { interval: "lifetime", amountCents: null, currency: null, renewsAt: null, cancelAtPeriodEnd: null };
    }
  } else if (access.hasActiveSubscription) {
    if (access.hasActiveStripeSubscription && access.subscription) {
      const fallbackCents = planType === "family" ? PLANS.familyMonthly.price : PLANS.monthly.price;
      const amountCents = await getSubscriptionDisplayAmountCents(access.subscription.stripePriceId, fallbackCents);
      plan = {
        interval: "monthly",
        amountCents,
        currency: "usd",
        renewsAt: access.subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: access.subscription.cancelAtPeriodEnd,
      };
    } else if (access.mobilePurchase) {
      plan = {
        interval: "monthly",
        amountCents: null,
        currency: null,
        renewsAt: access.mobilePurchase.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: null,
      };
    }
  }

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
      plan,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache" },
    },
  );
}
