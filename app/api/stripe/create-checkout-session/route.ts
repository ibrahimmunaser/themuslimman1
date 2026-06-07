import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;

export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before subscribing", requiresVerification: true },
        { status: 403 }
      );
    }

    if (!MONTHLY_PRICE_ID) {
      console.error("[CHECKOUT-SESSION] STRIPE_MONTHLY_PRICE_ID env var is not set");
      return NextResponse.json(
        { error: "Monthly subscription is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Short-circuit: if the session already marks hasPaid=true skip the DB check.
    const alreadyHasAccess = user.hasPaid || await hasActiveCourseAccess(user.id);
    if (alreadyHasAccess) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
      return NextResponse.json({ url: `${appUrl}/seerah` });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

    // Ensure or create Stripe customer so subscription links to user
    const { prisma } = await import("@/lib/db");
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    let customerId = dbUser?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT-SESSION] Error creating session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create checkout session: ${message}` }, { status: 500 });
  }
}
