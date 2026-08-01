import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session and returns the URL.
 * Blocked for Apple/Google IAP subscribers — they manage billing in the store.
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`stripe-portal:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getUserAccessInfo(user.id, user.hasPaid);
  if (access.purchasePlatform === "apple" || access.purchasePlatform === "google") {
    return NextResponse.json(
      {
        error:
          access.purchasePlatform === "apple"
            ? "Manage your subscription in the App Store."
            : "Manage your subscription in Google Play.",
        purchasePlatform: access.purchasePlatform,
      },
      { status: 403 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  const customerId = dbUser?.stripeCustomerId ?? null;

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
