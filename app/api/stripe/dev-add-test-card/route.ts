// DEV ONLY — remove before production
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("dummy")) {
    return NextResponse.json({ error: "Stripe key not configured" }, { status: 500 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = new Stripe(key, { typescript: true });

  // Find or create customer
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true, email: true, fullName: true } });
  let customerId = dbUser?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.fullName ?? "", metadata: { userId: user.id } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Create a test payment method using Stripe test token
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });

  // Check for duplicates by fingerprint
  const { data: existing } = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
  if (existing.some((e) => e.card?.fingerprint === pm.card?.fingerprint)) {
    await stripe.paymentMethods.detach(pm.id);
    return NextResponse.json({ error: "Card already saved (duplicate)" }, { status: 409 });
  }

  await stripe.paymentMethods.attach(pm.id, { customer: customerId });

  return NextResponse.json({
    success: true,
    card: { brand: pm.card?.brand, last4: pm.card?.last4, expMonth: pm.card?.exp_month, expYear: pm.card?.exp_year },
  });
}
