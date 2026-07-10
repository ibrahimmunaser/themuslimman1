import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { assertPaymentMethodOwnership, assertSubscriptionOwnership } from "@/lib/saved-cards";

/**
 * Called by checkout right before confirming a PaymentIntent with a saved card
 * (see components/billing/saved-card-picker.tsx). Two jobs:
 *
 *  1. Verify the selected payment method actually belongs to the authenticated
 *     user's Stripe customer. Never trust a client-supplied paymentMethodId on
 *     its own — even though Stripe's own confirm-time check would also reject a
 *     genuine mismatch, we don't rely on that alone.
 *
 *  2. For subscription (monthly) purchases, explicitly pin the chosen card as
 *     THIS subscription's default_payment_method. This guarantees future
 *     renewals use it — independent of (and in addition to)
 *     payment_settings.save_default_payment_method: "on_subscription", and
 *     independent of customer.invoice_settings.default_payment_method, since a
 *     subscription-level default always takes precedence and a customer may end
 *     up with multiple subscriptions/courses over time.
 *
 * Deliberately never touches customer.invoice_settings.default_payment_method —
 * selecting a saved card for one purchase must not silently change the
 * customer's global default (that's a separate, explicit action in
 * /billing → CardManager's "Set as default").
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const paymentMethodId =
      typeof (body as Record<string, unknown>)?.paymentMethodId === "string"
        ? (body as Record<string, string>).paymentMethodId
        : null;
    const subscriptionId =
      typeof (body as Record<string, unknown>)?.subscriptionId === "string"
        ? (body as Record<string, string>).subscriptionId
        : null;

    if (!paymentMethodId) {
      return NextResponse.json({ error: "paymentMethodId is required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing customer found" }, { status: 404 });
    }
    const customerId = dbUser.stripeCustomerId;

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId).catch(() => null);
    const pmCustomerId =
      pm && typeof pm.customer === "string"
        ? pm.customer
        : (pm?.customer as { id?: string } | null)?.id ?? null;

    const ownership = assertPaymentMethodOwnership({
      paymentMethodCustomerId: pmCustomerId,
      expectedCustomerId: customerId,
      card: pm?.card ? { expMonth: pm.card.exp_month, expYear: pm.card.exp_year } : null,
    });

    if (!ownership.ok) {
      console.warn(`[APPLY-SAVED-CARD] Rejected pm ${paymentMethodId} for user ${user.id}: ${ownership.reason}`);
      return NextResponse.json(
        { error: "This saved card is no longer available. Please choose another or add a new card." },
        { status: 403 }
      );
    }

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId).catch(() => null);
      const subCustomerId =
        sub && typeof sub.customer === "string"
          ? sub.customer
          : (sub?.customer as { id?: string } | null)?.id ?? null;

      const subOwnership = assertSubscriptionOwnership({
        subscriptionCustomerId: subCustomerId,
        expectedCustomerId: customerId,
      });

      if (!subOwnership.ok) {
        console.warn(`[APPLY-SAVED-CARD] Subscription ${subscriptionId} does not belong to user ${user.id}`);
        return NextResponse.json(
          { error: "Could not attach payment method to this subscription" },
          { status: 403 }
        );
      }

      await stripe.subscriptions.update(subscriptionId, { default_payment_method: paymentMethodId });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[APPLY-SAVED-CARD] error:", err);
    return NextResponse.json({ error: "Failed to apply saved card" }, { status: 500 });
  }
}
