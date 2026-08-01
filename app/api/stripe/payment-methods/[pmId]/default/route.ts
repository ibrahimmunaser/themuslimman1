import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("dummy")) throw new Error("Stripe key not configured");
  return new Stripe(key, { typescript: true });
}

/**
 * Sets a saved card as the customer's default payment method
 * (customer.invoice_settings.default_payment_method). This is what Stripe uses
 * to charge future subscription invoices and off-session payments when no
 * payment method is explicitly specified.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pmId: string }> }
) {
  const ip = getIP(req);
  const rl = await checkRateLimit(`payment-methods-default:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pmId } = await params;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    if (!dbUser?.stripeCustomerId) return NextResponse.json({ error: "No customer found" }, { status: 404 });

    const stripe = getStripe();

    // Verify this PM actually belongs to the user's customer before making it the default.
    const pm = await stripe.paymentMethods.retrieve(pmId);
    if (pm.customer !== dbUser.stripeCustomerId) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    await stripe.customers.update(dbUser.stripeCustomerId, {
      invoice_settings: { default_payment_method: pmId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set default payment method error:", err);
    return NextResponse.json({ error: "Failed to set default card" }, { status: 500 });
  }
}
