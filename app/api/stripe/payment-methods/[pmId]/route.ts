import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("dummy")) throw new Error("Stripe key not configured");
  return new Stripe(key, { typescript: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pmId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pmId } = await params;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    if (!dbUser?.stripeCustomerId) return NextResponse.json({ error: "No customer found" }, { status: 404 });

    const stripe = getStripe();

    // Verify this PM actually belongs to the user's customer before detaching
    const pm = await stripe.paymentMethods.retrieve(pmId);
    if (pm.customer !== dbUser.stripeCustomerId) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    await stripe.paymentMethods.detach(pmId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("detach payment method error:", err);
    return NextResponse.json({ error: "Failed to remove card" }, { status: 500 });
  }
}
