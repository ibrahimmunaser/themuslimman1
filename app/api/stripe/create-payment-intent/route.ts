import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { planId } = await request.json();

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as PlanId];

    // Create payment intent - works for both logged-in users and guest checkout
    const paymentIntentData: any = {
      amount: plan.price,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        planId: plan.id,
        planName: plan.name,
      },
      description: `${plan.name} - TheMuslimMan Seerah Course`,
    };

    // Add user metadata if logged in
    if (user) {
      paymentIntentData.metadata.userId = user.id;
      paymentIntentData.receipt_email = user.email;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
