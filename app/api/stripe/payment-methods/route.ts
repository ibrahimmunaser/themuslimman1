import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("dummy")) throw new Error("Stripe key not configured");
  return new Stripe(key, { typescript: true });
}

// Find or create a Stripe Customer for the user
async function getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

// GET — list saved payment methods + the customer's default payment method ID.
// Card data is never persisted in Prisma — it's always fetched live from Stripe.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    if (!dbUser?.stripeCustomerId) return NextResponse.json({ paymentMethods: [], defaultPaymentMethodId: null });

    const stripe = getStripe();
    const [{ data }, customer] = await Promise.all([
      stripe.paymentMethods.list({ customer: dbUser.stripeCustomerId, type: "card" }),
      stripe.customers.retrieve(dbUser.stripeCustomerId),
    ]);

    const defaultPaymentMethodId =
      !("deleted" in customer) && customer.invoice_settings?.default_payment_method
        ? (typeof customer.invoice_settings.default_payment_method === "string"
            ? customer.invoice_settings.default_payment_method
            : customer.invoice_settings.default_payment_method.id)
        : null;

    return NextResponse.json({
      paymentMethods: data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand ?? "unknown",
        last4: pm.card?.last4 ?? "????",
        expMonth: pm.card?.exp_month ?? 0,
        expYear: pm.card?.exp_year ?? 0,
        fingerprint: pm.card?.fingerprint,
      })),
      defaultPaymentMethodId,
    });
  } catch (err) {
    console.error("list payment methods error:", err);
    return NextResponse.json({ error: "Failed to load payment methods" }, { status: 500 });
  }
}

// POST — create a SetupIntent so the client can add a card
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerId = await getOrCreateCustomer(user.id, user.email, user.fullName);
    const stripe = getStripe();

    // Check existing cards to avoid true duplicates (same fingerprint)
    const { data: existing } = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
    const existingFingerprints = new Set(existing.map((pm) => pm.card?.fingerprint).filter(Boolean));

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: { userId: user.id, existingFingerprints: [...existingFingerprints].join(",") },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret, existingCount: existing.length });
  } catch (err) {
    console.error("create setup intent error:", err);
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 });
  }
}
