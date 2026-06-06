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
  searchParams: Promise<{ plan?: string; billing?: string; promo?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user && !user.emailVerified && process.env.NODE_ENV === "production") {
    redirect("/verify-email-pending");
  }

  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id, user.hasPaid);
    if (hasLifetime && user.planType === "family") redirect("/seerah");
  }

  // ── Resolve audience + billing from URL params ─────────────────────────────
  // Supports both new format (?plan=individual&billing=lifetime)
  // and legacy format (?plan=complete, ?plan=family, ?plan=monthly, etc.)
  type Audience = "individual" | "family";
  type Billing  = "lifetime"  | "monthly";

  let initialAudience: Audience = "individual";
  let initialBilling:  Billing  = "lifetime";

  const planParam    = params.plan?.toLowerCase()    ?? "";
  const billingParam = params.billing?.toLowerCase() ?? "";

  if (billingParam === "monthly")                          initialBilling  = "monthly";
  if (billingParam === "lifetime")                         initialBilling  = "lifetime";
  if (planParam    === "family" || planParam === "familymonthly") initialAudience = "family";
  if (planParam    === "monthly" || planParam === "familymonthly") initialBilling = "monthly";
  if (planParam    === "individual")                       initialAudience = "individual";

  // ── Pre-create individual lifetime intent server-side ──────────────────────
  // Only for the most common path (individual + lifetime + logged-in).
  // Monthly/family subscription intents are always created client-side.
  let initialClientSecret: string | null = null;
  const initialBasePrice  = getBasePrice();
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
          description:   `Complete Seerah — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
          receipt_email: user.email,
        });
        initialClientSecret = paymentIntent.client_secret;
      }
    } catch (e) {
      console.error("[CHECKOUT] Failed to pre-create payment intent:", e);
      initialClientSecret = null;
    }
  }

  // Pass the raw promo param as a server prop so the client never needs
  // useSearchParams() — that hook returns empty during SSR, which caused a
  // hydration mismatch between server-rendered and client-rendered HTML.
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
