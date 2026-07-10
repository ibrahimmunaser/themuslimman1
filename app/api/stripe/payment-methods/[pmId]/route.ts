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

    // Stripe does NOT automatically clear invoice_settings.default_payment_method
    // when the underlying payment method is detached — it would keep pointing at a
    // dangling PM ID. Check before detaching so we can reassign or clear it after.
    const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId);
    const currentDefaultId =
      !("deleted" in customer) && customer.invoice_settings?.default_payment_method
        ? (typeof customer.invoice_settings.default_payment_method === "string"
            ? customer.invoice_settings.default_payment_method
            : customer.invoice_settings.default_payment_method.id)
        : null;
    const wasDefault = currentDefaultId === pmId;

    await stripe.paymentMethods.detach(pmId);

    if (wasDefault) {
      const { data: remaining } = await stripe.paymentMethods.list({
        customer: dbUser.stripeCustomerId,
        type: "card",
      });
      // paymentMethods.list is sorted most-recently-attached first — a reasonable
      // default pick when the customer hasn't told us which card to prefer.
      const nextDefault = remaining[0]?.id;
      await stripe.customers.update(dbUser.stripeCustomerId, {
        invoice_settings: { default_payment_method: nextDefault ?? "" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("detach payment method error:", err);
    return NextResponse.json({ error: "Failed to remove card" }, { status: 500 });
  }
}
