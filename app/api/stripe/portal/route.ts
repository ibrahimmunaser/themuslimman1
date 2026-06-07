import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session and returns the URL.
 * Used to let monthly subscribers update their payment method,
 * view invoices, or cancel their subscription.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let customerId = user.stripeCustomerId;

  // Fall back: look up stripeCustomerId from DB if not in session
  if (!customerId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    customerId = dbUser?.stripeCustomerId ?? null;
  }

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Please contact support." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[STRIPE PORTAL] Failed to create portal session:", err);
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again or contact support." },
      { status: 500 }
    );
  }
}
