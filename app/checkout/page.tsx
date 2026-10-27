import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCachedCurrentUser } from "@/lib/auth-cache";
import { getUserAccessInfo } from "@/lib/access";
import CheckoutClientPage from "./page-client";
import { stripe } from "@/lib/stripe";
import { lifetimePriceMetadata, quoteFromHeaderBag } from "@/lib/request-country-price";

export const dynamic = "force-dynamic";


// Legacy plan param aliases → new format
const LEGACY_PLAN_ALIASES: Record<string, string> = {
  "complete":      "individual-lifetime",
  "family":        "family-lifetime",
  "monthly":       "individual-lifetime",
  "familymonthly": "family-lifetime",
};

interface Props {
  searchParams: Promise<{ plan?: string; billing?: string; audience?: string; source?: string; email?: string; name?: string; score?: string; result_type?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCachedCurrentUser(), searchParams]);

  // ── Resolve plan from URL param ────────────────────────────────────────────
  const rawPlan = (params.plan ?? "").toLowerCase().trim();
  const normalizedPlan = LEGACY_PLAN_ALIASES[rawPlan] ?? rawPlan;

  // Lifetime holders already own the course. Family is not sold or offered as an upgrade.
  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id, user.hasPaid);
    if (hasLifetime) redirect("/seerah");
  }

  const audienceParam = (params.audience ?? "").toLowerCase();
  const wantsFamily =
    normalizedPlan.startsWith("family") ||
    audienceParam === "family" ||
    rawPlan === "family" ||
    rawPlan === "familymonthly";

  // Public purchase is lifetime-only. Old family links become the individual plan.
  if (
    wantsFamily ||
    normalizedPlan === "individual-monthly" ||
    normalizedPlan === "individual-trial"
  ) {
    const qs = new URLSearchParams();
    qs.set("plan", "individual-lifetime");
    if (params.source) qs.set("source", params.source);
    if (params.utm_source) qs.set("utm_source", params.utm_source);
    if (params.utm_medium) qs.set("utm_medium", params.utm_medium);
    if (params.utm_campaign) qs.set("utm_campaign", params.utm_campaign);
    if (params.utm_content) qs.set("utm_content", params.utm_content);
    if (params.email) qs.set("email", params.email);
    if (params.name) qs.set("name", params.name);
    redirect(`/checkout?${qs.toString()}`);
  }

  type Audience = "individual" | "family";
  type Billing  = "lifetime"  | "monthly" | "trial";

  let initialAudience: Audience = "individual";
  let initialBilling:  Billing  = "lifetime";

  const planParam    = params.plan?.toLowerCase()    ?? "";
  const billingParam = params.billing?.toLowerCase() ?? "";

  // Map plan IDs to audience + billing for the Elements flow.
  if      (normalizedPlan === "individual-lifetime") { initialAudience = "individual"; initialBilling = "lifetime"; }
  // Legacy URL param fallbacks — monthly/trial billing params map to lifetime.
  else {
    initialBilling = "lifetime";
    const audienceParam = params.audience?.toLowerCase() ?? "";
    if (audienceParam === "individual" || planParam === "individual") initialAudience = "individual";
    void billingParam;
  }

  // Base price for the selected plan — always sourced from PLANS so this stays
  // in sync with stripe-config.ts. Never hardcode prices here.
  // For lifetime upgrades (individual → family), use the upgrade difference price
  // so the correct amount is shown immediately without waiting for the API response.
  const hdrs = await headers();
  const lifetimeQuote = quoteFromHeaderBag((name) => hdrs.get(name));

  // Public checkout is the country lifetime price, including /checkout with no plan param.
  const initialBasePrice = lifetimeQuote.amountCents;
  let initialClientSecret: string | null = null;
  let initialFinalPrice = initialBasePrice;

  const rawScore     = parseInt(params.score ?? "", 10);
  const initialQuizScore  = !isNaN(rawScore) && rawScore >= 0 && rawScore <= 100 ? rawScore : null;
  const initialResultType = params.result_type?.trim() ?? null;
  const prefillEmail = params.email?.trim() ?? null;
  const isQuizFunnelCheckout = !!prefillEmail;
  const quizGuestOverride = !!(
    user &&
    isQuizFunnelCheckout &&
    prefillEmail!.toLowerCase() !== user.email.toLowerCase()
  );

  // Pre-create PI only when create-payment-intent would also allow it:
  // no lifetime, no active mobile IAP, not a family-plan holder buying individual.
  // Skipping these gates left abandoned Stripe PIs for users who already have access.
  if (user && !quizGuestOverride && initialAudience === "individual" && initialBilling === "lifetime" && user.planType !== "family") {
    try {
      const access = await getUserAccessInfo(user.id, user.hasPaid);
      if (access.hasLifetime || access.mobilePurchase) {
        initialClientSecret = null;
      } else {
      const finalAmount = initialBasePrice;
      initialFinalPrice = finalAmount;

      // Resolve creator from the ?source= param for influencer link attribution.
      const sourceParam = params.source?.trim().toLowerCase() ?? null;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:               finalAmount,
        currency:             "usd",
        payment_method_types: ["card"],
        metadata: {
          userId:   user.id,
          planId:   "complete",
          planName: "Complete Seerah",
          ...lifetimePriceMetadata(lifetimeQuote),
          ...(sourceParam ? { creator: sourceParam } : {}),
        },
        description:   `Complete Seerah Lifetime — TheMuslimMan`,
        receipt_email: user.email,
      });
      initialClientSecret = paymentIntent.client_secret;
      }
    } catch (e) {
      console.error("[CHECKOUT] Failed to pre-create payment intent:", e);
      initialClientSecret = null;
    }
  }

  const sourceParamProp = params.source?.trim().toLowerCase() ?? null;
  const prefillName  = params.name?.trim()  ?? null;
  const utmSourceProp   = params.utm_source?.trim()   ?? null;
  const utmMediumProp   = params.utm_medium?.trim()   ?? null;
  const utmCampaignProp = params.utm_campaign?.trim() ?? null;
  const utmContentProp  = params.utm_content?.trim()  ?? null;

  return (
    <CheckoutClientPage
      userEmail={user?.email ?? ""}
      initialUserId={user?.id ?? ""}
      userPlanType={user?.planType ?? null}
      initialAudience={initialAudience}
      initialBilling={initialBilling}
      initialClientSecret={initialClientSecret}
      initialBasePrice={initialBasePrice}
      initialFinalPrice={initialFinalPrice}
      initialSourceParam={sourceParamProp}
      isLifetimeUpgrade={false}
      initialEmail={prefillEmail}
      initialName={prefillName}
      initialQuizScore={initialQuizScore}
      initialResultType={initialResultType}
      initialUtmSource={utmSourceProp}
      initialUtmMedium={utmMediumProp}
      initialUtmCampaign={utmCampaignProp}
      initialUtmContent={utmContentProp}
    />
  );
}
