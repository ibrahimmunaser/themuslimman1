import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import CheckoutClientPage from "./page-client";
import { stripe } from "@/lib/stripe";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";

export const dynamic = "force-dynamic";


// Legacy plan param aliases → new format
const LEGACY_PLAN_ALIASES: Record<string, string> = {
  "complete":      "individual-lifetime",
  "family":        "family-lifetime",
  "monthly":       "individual-monthly",
  "familymonthly": "family-monthly",
};

interface Props {
  searchParams: Promise<{ plan?: string; billing?: string; promo?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  // Redirect away if the user already has full access.
  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id, user.hasPaid);
    if (hasLifetime) redirect("/seerah");
  }

  // ── Resolve plan from URL param ────────────────────────────────────────────
  const rawPlan = (params.plan ?? "").toLowerCase().trim();
  const normalizedPlan = LEGACY_PLAN_ALIASES[rawPlan] ?? rawPlan;

  type Audience = "individual" | "family";
  type Billing  = "lifetime"  | "monthly" | "trial";

  let initialAudience: Audience = "individual";
  let initialBilling:  Billing  = "lifetime";

  const planParam    = params.plan?.toLowerCase()    ?? "";
  const billingParam = params.billing?.toLowerCase() ?? "";

  // Map plan IDs to audience + billing for the Elements flow.
  // Monthly plans redirect to trial — trial is the entry point to the monthly subscription.
  if      (normalizedPlan === "individual-trial")   { initialAudience = "individual"; initialBilling = "trial";    }
  else if (normalizedPlan === "family-trial")        { initialAudience = "family";     initialBilling = "trial";    }
  else if (normalizedPlan === "individual-lifetime") { initialAudience = "individual"; initialBilling = "lifetime"; }
  else if (normalizedPlan === "family-lifetime")     { initialAudience = "family";     initialBilling = "lifetime"; }
  else if (normalizedPlan === "individual-monthly")  { initialAudience = "individual"; initialBilling = "trial";    }
  else if (normalizedPlan === "family-monthly")      { initialAudience = "family";     initialBilling = "trial";    }
  // Legacy URL param fallbacks — treat monthly as trial
  else {
    if (billingParam === "monthly")                                initialBilling  = "trial";
    if (billingParam === "lifetime")                               initialBilling  = "lifetime";
    if (planParam === "family" || planParam === "familymonthly")   initialAudience = "family";
    if (planParam === "monthly" || planParam === "familymonthly")  initialBilling  = "trial";
    if (planParam === "individual")                                 initialAudience = "individual";
  }

  let initialClientSecret: string | null = null;
  const initialBasePrice  = 7900;
  let initialFinalPrice = initialBasePrice;
  let initialDiscountAmount  = 0;
  let initialAppliedPromo: string | null = null;
  let initialAppliedPromoLabel: string | null = null;
  let initialFreeAccess = false;

  if (user && initialAudience === "individual" && initialBilling === "lifetime") {
    try {
      const promoParam = params.promo?.trim().toUpperCase() ?? null;
      let finalAmount    = initialBasePrice;
      let promoDiscount  = 0;
      let appliedPromoCode: string | null = null;

      if (promoParam) {
        const promo = validatePromoCode(promoParam);
        if (promo) {
          finalAmount       = applyDiscount(initialBasePrice, promo);
          promoDiscount     = initialBasePrice - finalAmount;
          appliedPromoCode  = promoParam;
          initialAppliedPromo      = promoParam;
          initialAppliedPromoLabel = promo.label;
        }
      }

      initialDiscountAmount = promoDiscount;
      initialFinalPrice     = finalAmount;

      if (finalAmount === 0) {
        initialFreeAccess = true;
      } else {
        const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;
        const paymentIntent = await stripe.paymentIntents.create({
          amount:               finalAmount,
          currency:             "usd",
          payment_method_types: ["card"],
          metadata: {
            userId:   user.id,
            planId:   "complete",
            planName: "Complete Seerah",
            baseAmount:   String(initialBasePrice),
            finalAmount:  String(finalAmount),
            ...(appliedPromoCode ? {
              promoCode:           appliedPromoCode,
              promoDiscountAmount: String(promoDiscount),
            } : {}),
            ...(creatorConfig ? {
              creator:      creatorConfig.creator,
              utm_source:   creatorConfig.utm_source   ?? "",
              utm_medium:   creatorConfig.utm_medium   ?? "",
              utm_campaign: creatorConfig.utm_campaign ?? "",
              utm_content:  creatorConfig.utm_content  ?? "",
            } : {}),
          },
          description:   `Complete Seerah Lifetime — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
          receipt_email: user.email,
        });
        initialClientSecret = paymentIntent.client_secret;
      }
    } catch (e) {
      console.error("[CHECKOUT] Failed to pre-create payment intent:", e);
      initialClientSecret = null;
    }
  }

  const promoParamProp = params.promo?.trim().toUpperCase() ?? null;

  return (
    <CheckoutClientPage
      userEmail={user?.email ?? ""}
      initialAudience={initialAudience}
      initialBilling={initialBilling}
      initialClientSecret={initialClientSecret}
      initialBasePrice={initialBasePrice}
      initialFinalPrice={initialFinalPrice}
      initialDiscountAmount={initialDiscountAmount}
      initialAppliedPromo={initialAppliedPromo}
      initialAppliedPromoLabel={initialAppliedPromoLabel}
      initialFreeAccess={initialFreeAccess}
      initialPromoParam={promoParamProp}
    />
  );
}
