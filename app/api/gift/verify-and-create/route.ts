import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateGiftToken, hashGiftToken, buildClaimUrl, sendGiftClaimEmail } from "@/lib/gift";

export async function GET(request: NextRequest) {
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
        // We won the race — send the email
        const claimUrl = buildClaimUrl(rawToken);
        await sendGiftClaimEmail({
          recipientEmail: gift.recipientEmail,
          recipientName: gift.recipientName,
          purchaserEmail: gift.purchaserEmail,
          giftMessage: gift.giftMessage,
          claimUrl,
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
