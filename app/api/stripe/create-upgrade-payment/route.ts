import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to upgrade" },
        { status: 401 }
      );
    }

    // Check user's current purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
        status: "succeeded",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasEssentials = purchases.some(p => p.planId === "essentials");
    const hasComplete = purchases.some(p => p.planId === "complete");

    // Verify user has Essentials but not Complete
    if (!hasEssentials) {
      return NextResponse.json(
        { error: "You must have Essentials to upgrade" },
        { status: 403 }
      );
    }

    if (hasComplete) {
      return NextResponse.json(
        { error: "You already have Complete Seerah" },
        { status: 403 }
      );
    }

    const upgradePrice = PLANS.essentials.upgradePrice!;

    // Create a payment intent for the upgrade price
    const paymentIntent = await stripe.paymentIntents.create({
      amount: upgradePrice,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        planId: "complete",
        planName: "Complete Seerah",
        isUpgrade: "true",
        upgradedFrom: "essentials",
      },
      description: `Upgrade from Essentials to Complete Seerah - TheMuslimMan`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating upgrade payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: `Failed to initialize upgrade payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
