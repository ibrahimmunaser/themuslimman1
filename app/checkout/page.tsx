import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { stripe } from "@/lib/stripe";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";
import { getBasePrice } from "@/lib/early-access";
import CheckoutClientPage from "./page-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ plan?: string; promo?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id, user.hasPaid);
    if (hasLifetime && user.planType === "family") {
      redirect("/my-courses");
    }
  }

  const initialPlan = params.plan === "family" ? "family" : "complete";

  // ── Pre-create payment intent server-side for logged-in individual plan ──
  // This eliminates the client-side API round trip, showing the form immediately.
  let initialClientSecret: string | null = null;
  let initialBasePrice = getBasePrice();
  let initialFinalPrice = initialBasePrice;
  let initialDiscountAmount = 0;
  let initialAppliedPromo: string | null = null;
  let initialAppliedPromoLabel: string | null = null;
  let initialFreeAccess = false;

  if (user && initialPlan === "complete") {
    try {
      const promoParam = params.promo?.trim().toUpperCase() ?? null;
      let finalAmount = initialBasePrice;
      let promoDiscount = 0;
      let appliedPromoCode: string | null = null;

      if (promoParam) {
        const promo = validatePromoCode(promoParam);
        if (promo) {
          finalAmount = applyDiscount(initialBasePrice, promo);
          promoDiscount = initialBasePrice - finalAmount;
          appliedPromoCode = promoParam;
          initialAppliedPromo = promoParam;
          initialAppliedPromoLabel = promo.label;
        }
      }

      initialDiscountAmount = promoDiscount;
      initialFinalPrice = finalAmount;

      if (finalAmount === 0) {
        initialFreeAccess = true;
      } else {
        const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: finalAmount,
          currency: "usd",
          payment_method_types: ["card"],
          metadata: {
            userId: user.id,
            planId: "complete",
            planName: "Complete Seerah",
            baseAmount: String(initialBasePrice),
            finalAmount: String(finalAmount),
            ...(appliedPromoCode ? {
              promoCode: appliedPromoCode,
              promoDiscountAmount: String(promoDiscount),
            } : {}),
            ...(creatorConfig ? {
              creator: creatorConfig.creator,
              utm_source: creatorConfig.utm_source ?? "",
              utm_medium: creatorConfig.utm_medium ?? "",
              utm_campaign: creatorConfig.utm_campaign ?? "",
              utm_content: creatorConfig.utm_content ?? "",
            } : {}),
          },
          description: `Complete Seerah — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
          receipt_email: user.email,
        });
        initialClientSecret = paymentIntent.client_secret;
      }
    } catch (e) {
      // If pre-creation fails for any reason, fall back to client-side creation
      console.error("[CHECKOUT] Failed to pre-create payment intent:", e);
      initialClientSecret = null;
    }
  }

  return (
    <CheckoutClientPage
      userEmail={user?.email ?? ""}
      initialPlan={initialPlan}
      initialClientSecret={initialClientSecret}
      initialBasePrice={initialBasePrice}
      initialFinalPrice={initialFinalPrice}
      initialDiscountAmount={initialDiscountAmount}
      initialAppliedPromo={initialAppliedPromo}
      initialAppliedPromoLabel={initialAppliedPromoLabel}
      initialFreeAccess={initialFreeAccess}
    />
  );
}
