"use client";

/**
 * InfluencerQuickCheckout — single scrolling sales page + separate payment step.
 *
 * Sales page combines overview, free lesson, features, pricing, and FAQ.
 * Payment form is only shown at ?step=checkout (legacy ?step=plans also works).
 * Old overview/lesson step URLs map back to the sales page.
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";
import type { InfluencerConfig } from "@/lib/influencer-configs";
import type { Part } from "@/lib/types";
import type { Part1AssetUrls } from "@/lib/part1-preview-data";
import type { CourseLang } from "@/lib/course-lang";
import { InfluencerSalesPage } from "@/components/influencer/influencer-sales-page";
import { CheckoutStep }        from "@/components/influencer/checkout-step";
import { SuccessStep }         from "@/components/influencer/success-step";

type Screen = "sales" | "checkout";

function parseScreen(raw: string | null): Screen {
  if (raw === "checkout" || raw === "plans") return "checkout";
  return "sales";
}

interface InfluencerQuickCheckoutProps {
  config: InfluencerConfig;
  part1: Part | null;
  part1AssetUrls: Part1AssetUrls;
  initialLang?: CourseLang;
  isAuthenticated: boolean;
  userEmail?: string;
}

function InfluencerQuickCheckoutInner({
  config,
  part1,
  part1AssetUrls,
  initialLang = "en",
  isAuthenticated,
  userEmail = "",
}: InfluencerQuickCheckoutProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const screen = parseScreen(searchParams.get("step"));
  const planParam = searchParams.get("plan");
  const initialPlan: "lifetime" | "monthly" =
    planParam === "individual-monthly" || planParam === "monthly"
      ? "monthly"
      : "lifetime";

  const [paymentIntentId, setPiId]    = useState<string | undefined>();
  const [redirecting, setRedirecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"lifetime" | "monthly">(initialPlan);

  useEffect(() => {
    if (screen === "checkout") setCheckoutPlan(initialPlan);
  }, [screen, initialPlan]);

  useEffect(() => {
    captureAttribution();
    trackEvent(
      "influencer_landing_view",
      { influencer_slug: config.slug, page_variant: "sales_page" },
      { creator: config.slug },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (screen === "checkout") {
      trackEvent(
        "pricing_screen_viewed",
        { influencer_slug: config.slug, page_variant: "checkout_step" },
        { creator: config.slug },
      );
    }
  }, [screen, config.slug]);

  // Deep-link old ?step=lesson URLs to the free preview section
  useEffect(() => {
    const step = searchParams.get("step");
    if (step === "lesson" || step === "preview") {
      requestAnimationFrame(() => {
        document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  const pushScreen = useCallback((next: Screen, plan?: "lifetime" | "monthly") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "checkout") {
      params.set("step", "checkout");
      if (plan === "monthly") params.set("plan", "individual-monthly");
      else params.set("plan", "individual-lifetime");
    } else {
      params.delete("step");
      params.delete("plan");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  }, [pathname, searchParams, router]);

  const goToCheckout = useCallback((plan: "lifetime" | "monthly") => {
    setCheckoutPlan(plan);
    pushScreen("checkout", plan);
  }, [pushScreen]);

  const goBackToSales = useCallback(() => {
    trackEvent(
      "checkout_back_clicked",
      { influencer_slug: config.slug, from_step: "checkout", to_step: "sales" },
      { allowDuplicates: true, creator: config.slug },
    );
    pushScreen("sales");
  }, [config.slug, pushScreen]);

  const onPaymentSuccess = useCallback((piId: string) => {
    setPiId(piId);
    setShowSuccess(true);
  }, []);

  const onPaymentRedirecting = useCallback(() => setRedirecting(true), []);

  if (redirecting) {
    return (
      <div className="min-h-[100dvh] bg-background text-text flex items-center justify-center px-5">
        <div className="text-center">
          <div
            className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"
            aria-label="Redirecting"
          />
          <p className="text-zinc-400 text-sm">Completing payment…</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return <SuccessStep config={config} paymentIntentId={paymentIntentId} />;
  }

  if (screen === "checkout") {
    return (
      <div className="min-h-[100dvh] bg-background text-text">
        <CheckoutStep
          config={config}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          initialPlan={checkoutPlan}
          onBack={goBackToSales}
          onSuccess={onPaymentSuccess}
          onRedirecting={onPaymentRedirecting}
        />
      </div>
    );
  }

  return (
    <InfluencerSalesPage
      config={config}
      part1={part1}
      part1AssetUrls={part1AssetUrls}
      initialLang={initialLang}
      onCheckout={goToCheckout}
    />
  );
}

export default function InfluencerQuickCheckout(props: InfluencerQuickCheckoutProps) {
  return (
    <Suspense fallback={null}>
      <InfluencerQuickCheckoutInner {...props} />
    </Suspense>
  );
}

/** Kept for FunnelProgress / analytics type imports elsewhere */
export type FlowStep = "offer" | "preview" | "checkout";
