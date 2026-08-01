import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateGiftToken, hashGiftToken, buildClaimUrl, sendGiftClaimEmail } from "@/lib/gift";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`gift-verify:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const paymentIntentId = request.nextUrl.searchParams.get("payment_intent");
  if (!paymentIntentId) {
    return NextResponse.json({ error: "Missing payment_intent" }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Refunded charges still report PI status "succeeded" — refuse to activate.
    // Fail closed when we cannot confirm the charge is unrefunded.
    const chargeId =
      typeof paymentIntent.latest_charge === "string"
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge && typeof paymentIntent.latest_charge === "object"
          ? (paymentIntent.latest_charge as { id?: string }).id
          : null;
    if (!chargeId) {
      return NextResponse.json(
        { error: "Unable to verify payment charge. Please try again." },
        { status: 503 }
      );
    }
    try {
      const charge = await stripe.charges.retrieve(chargeId);
      if (
        charge.refunded ||
        (charge.amount_refunded > 0 && charge.amount_refunded >= charge.amount)
      ) {
        return NextResponse.json({ error: "Payment was refunded" }, { status: 400 });
      }
    } catch (chargeErr) {
      console.error("[GIFT VERIFY] Charge refund check failed (fail-closed):", chargeErr);
      return NextResponse.json(
        { error: "Unable to verify payment status. Please try again." },
        { status: 503 }
      );
    }

    const giftRow = await prisma.giftPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { status: true },
    });
    if (giftRow?.status === "refunded" || giftRow?.status === "expired") {
      return NextResponse.json({ error: "This gift payment was refunded or expired" }, { status: 400 });
    }

    const { type, purchaserUserId } = paymentIntent.metadata;

    if (type !== "gift") {
      return NextResponse.json({ error: "Not a gift payment" }, { status: 400 });
    }

    if (purchaserUserId && purchaserUserId !== user.id) {
      return NextResponse.json(
        { error: "Payment does not belong to this account" },
        { status: 403 }
      );
    }

    // Find the pending gift purchase
    const gift = await prisma.giftPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift record not found" }, { status: 404 });
    }

    // If not yet activated, transition to paid and send email
    if (gift.status === "pending") {
      const rawToken = generateGiftToken();
      const tokenHash = hashGiftToken(rawToken);

      // Atomic update — only proceed if still in pending state
      const updated = await prisma.giftPurchase.updateMany({
        where: { id: gift.id, status: "pending" },
        data: { status: "paid", claimTokenHash: tokenHash },
      });

      if (updated.count > 0) {
        // Post-activate refund race: re-check charge before emailing a claim link.
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          if (
            charge.refunded ||
            (charge.amount_refunded > 0 && charge.amount_refunded >= charge.amount)
          ) {
            await prisma.giftPurchase.update({
              where: { id: gift.id },
              data: { status: "refunded", claimTokenHash: null },
            });
            return NextResponse.json({ error: "Payment was refunded" }, { status: 400 });
          }
        } catch (postErr) {
          console.error("[GIFT VERIFY] Post-activate charge re-check failed (fail-closed):", postErr);
          // Only roll back what we just activated — never resurrect refunded→pending (H2).
          await prisma.giftPurchase.updateMany({
            where: { id: gift.id, status: "paid" },
            data: { status: "pending", claimTokenHash: null },
          }).catch(() => {});
          return NextResponse.json(
            { error: "Unable to verify payment status. Please try again." },
            { status: 503 }
          );
        }

        const stillPaid = await prisma.giftPurchase.findUnique({
          where: { id: gift.id },
          select: { status: true },
        });
        if (!stillPaid || stillPaid.status !== "paid") {
          return NextResponse.json({ error: "Payment was refunded" }, { status: 400 });
        }

        const claimUrl = buildClaimUrl(rawToken);
        await sendGiftClaimEmail({
          recipientEmail: gift.recipientEmail,
          recipientName: gift.recipientName,
          purchaserEmail: gift.purchaserEmail,
          giftMessage: gift.giftMessage,
          claimUrl,
          planId: gift.planId ?? "complete",
        }).catch((err) =>
          console.error("[GIFT] Failed to send claim email:", err)
        );

        await prisma.giftPurchase.update({
          where: { id: gift.id },
          data: { emailSentAt: new Date() },
        }).catch((err) =>
          console.error("[GIFT] Failed to update emailSentAt:", err)
        );
      }
    }

    // Re-fetch after potential update
    const finalGift = await prisma.giftPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    return NextResponse.json({
      status: finalGift?.status ?? "paid",
      recipientEmail: gift.recipientEmail,
      recipientName: gift.recipientName,
      emailSent: !!finalGift?.emailSentAt,
    });
  } catch (error) {
    console.error("[GIFT] verify-and-create error:", error);
    return NextResponse.json({ error: "Failed to verify gift payment" }, { status: 500 });
  }
}
