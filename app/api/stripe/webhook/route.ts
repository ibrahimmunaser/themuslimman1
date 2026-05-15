import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[WEBHOOK] POST /api/stripe/webhook: Request received`);
  
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error(`[WEBHOOK] POST /api/stripe/webhook: No signature provided`);
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK] POST /api/stripe/webhook: Event verified - type: ${event.type}, id: ${event.id}`);
  } catch (err) {
    console.error(`[WEBHOOK] POST /api/stripe/webhook: Signature verification FAILED:`, err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[WEBHOOK] payment_intent.succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount} ${paymentIntent.currency}, customer: ${paymentIntent.customer}`);
      await handlePaymentSuccess(paymentIntent);
      break;
    }

    case "payment_intent.payment_failed": {
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.error(`[WEBHOOK] payment_intent.payment_failed: ${failedPayment.id}, reason: ${failedPayment.last_payment_error?.message}`);
      break;
    }

    default:
      console.log(`[WEBHOOK] Unhandled event type: ${event.type} (id: ${event.id})`);
  }

  const elapsed = Date.now() - startTime;
  console.log(`[WEBHOOK] POST /api/stripe/webhook: Complete for event ${event.type} [${elapsed}ms]`);

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const startTime = Date.now();
  const { userId, planId, planName } = paymentIntent.metadata;

  console.log(`[WEBHOOK] handlePaymentSuccess: Processing payment ${paymentIntent.id} - userId: ${userId}, planId: ${planId}, planName: ${planName}`);

  if (!userId || !planId) {
    console.error(`[WEBHOOK] handlePaymentSuccess: Missing metadata in payment intent ${paymentIntent.id} - userId: ${userId}, planId: ${planId}`);
    return;
  }

  try {
    console.log(`[WEBHOOK] handlePaymentSuccess: Upserting purchase record for payment ${paymentIntent.id}...`);
    
    // Upsert purchase — idempotent so webhook retries and the verify-payment
    // route don't create duplicate records for the same PaymentIntent.
    await prisma.purchase.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      create: {
        userId,
        planId,
        planName,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: "succeeded",
      },
      update: {
        status: "succeeded",
      },
    });
    
    console.log(`[WEBHOOK] handlePaymentSuccess: Purchase record upserted for payment ${paymentIntent.id}`);

    // Update user's hasPaid flag and save stripeCustomerId if present
    const updateData: { hasPaid: boolean; stripeCustomerId?: string } = { hasPaid: true };
    if (paymentIntent.customer && typeof paymentIntent.customer === "string") {
      updateData.stripeCustomerId = paymentIntent.customer;
      console.log(`[WEBHOOK] handlePaymentSuccess: Updating user ${userId} with stripeCustomerId ${paymentIntent.customer}`);
    }
    await prisma.user.update({ where: { id: userId }, data: updateData });
    console.log(`[WEBHOOK] handlePaymentSuccess: User ${userId} updated with hasPaid=true`);

    // Attach payment method to Stripe customer for saved cards
    if (paymentIntent.payment_method && paymentIntent.customer) {
      console.log(`[WEBHOOK] handlePaymentSuccess: Attaching payment method ${paymentIntent.payment_method} to customer ${paymentIntent.customer}`);
      try {
        await stripe.paymentMethods.attach(paymentIntent.payment_method as string, {
          customer: paymentIntent.customer as string,
        });
        console.log(`[WEBHOOK] handlePaymentSuccess: Payment method attached successfully`);
      } catch (attachError) {
        console.log(`[WEBHOOK] handlePaymentSuccess: Payment method already attached or attachment failed (non-critical):`, attachError);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[WEBHOOK] handlePaymentSuccess: Purchase recorded for user ${userId}: ${planName ?? planId} [${elapsed}ms]`);

    // Send purchase confirmation email — non-blocking
    sendPurchaseConfirmationEmail(userId, planName ?? planId).catch((err) =>
      console.error("[WEBHOOK] [PURCHASE_EMAIL] Failed to send confirmation email:", err)
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[WEBHOOK] handlePaymentSuccess: ERROR recording purchase for payment ${paymentIntent.id} [${elapsed}ms]:`, error);
  }
}

async function sendPurchaseConfirmationEmail(userId: string, planName: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });

  if (!user) {
    console.error("[PURCHASE_EMAIL] User not found:", userId);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seerah.themuslimman.com";
  const year = new Date().getFullYear();

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to: user.email,
    subject: "Your Complete Seerah access is ready",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #f4c542; margin: 0 0 8px 0; font-size: 24px;">JazakAllahu Khayran</h1>
            <p style="color: #ccc; margin: 0; font-size: 15px;">Your access is ready.</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Assalamu Alaykum ${user.fullName ?? ""},</p>

            <p style="font-size: 15px; margin: 0 0 16px 0;">
              Thank you for your purchase. Your <strong>${planName}</strong> is now active and ready to use.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/seerah" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Open the Course Dashboard
              </a>
            </div>

            <div style="background: #f9f4e8; border: 1px solid #e8d88a; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 15px; font-weight: 700; color: #333; margin: 0 0 12px 0;">Start here:</p>
              <ol style="font-size: 14px; color: #555; padding-left: 20px; margin: 0; line-height: 1.8;">
                <li><a href="${appUrl}/seerah" style="color: #b8960c; text-decoration: none;">Open the course dashboard</a></li>
                <li>Begin with <strong>Part 1</strong></li>
                <li>For each part, use the <strong>video, briefing, flashcards, and quiz together</strong> — they&rsquo;re designed to work as a set</li>
                <li>Reply to this email or <a href="${appUrl}/contact" style="color: #b8960c; text-decoration: none;">contact support</a> if anything breaks or is unclear</li>
              </ol>
            </div>

            <p style="font-size: 14px; color: #555; margin: 0 0 10px 0;">
              Your access includes:
            </p>
            <ul style="font-size: 14px; color: #555; padding-left: 20px; margin: 0 0 24px 0;">
              <li style="margin-bottom: 6px;">All 100 Seerah parts — videos, audio, briefings, flashcards, quizzes, and more</li>
              <li style="margin-bottom: 6px;">Progress tracking across every lesson</li>
              <li style="margin-bottom: 6px;">Lifetime access — learn at your own pace, anytime</li>
            </ul>

            <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #666;">
              <strong style="color: #333;">7-Day Clarity Guarantee:</strong> If the course is not what you expected,
              email us within 7 days for a full refund. No hoops.
              <a href="${appUrl}/contact" style="color: #b8960c; text-decoration: none;"> Contact us here.</a>
            </div>

            <p style="font-size: 13px; color: #777; margin: 0 0 12px 0;">
              Want to understand our approach and sources?
              <a href="${appUrl}/methodology" style="color: #b8960c;"> Read our methodology.</a>
            </p>

            <p style="font-size: 13px; color: #aaa; margin: 0;">
              After you&rsquo;ve had a chance to use the course, we&rsquo;d love to hear what you think.
              No pressure — whenever you&rsquo;re ready:
              <a href="${appUrl}/testimonial" style="color: #b8960c;"> Share your feedback.</a>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © ${year} TheMuslimMan · Complete Seerah
            </p>
          </div>
        </body>
      </html>
    `,
  });

  console.log(`[PURCHASE_EMAIL] Confirmation sent to ${user.email}`);
}
