"use client";

/**
 * InfluencerQuickCheckout — mobile-first guided checkout flow.
 *
 * Three primary screens (offer → preview → checkout) plus a terminal
 * success screen. The active screen is driven by a real `?step=` URL query
 * parameter (see FLOW_TO_URL_STEP below), so browser Back/Forward and page
 * refresh all resolve to the correct screen. Screens are absolutely
 * positioned and slide horizontally via CSS transform; success/redirect
 * states are rendered as simple full-screen overlays instead of
 * participating in the slide, since they are one-way terminal states.
 */

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";
import type { InfluencerConfig } from "@/lib/influencer-configs";
import type { Part } from "@/lib/types";
import type { Part1AssetUrls } from "@/lib/part1-preview-data";
import { OfferStep }           from "@/components/influencer/offer-step";
import { PreviewStep }         from "@/components/influencer/preview-step";
import { CheckoutStep }        from "@/components/influencer/checkout-step";
import { SuccessStep }         from "@/components/influencer/success-step";
import { FunnelProgress }      from "@/components/influencer/funnel-progress";

/** The three navigable funnel screens (success is handled separately as a terminal overlay). */
export type FlowStep = "offer" | "preview" | "checkout";

const STEP_ORDER: FlowStep[] = ["offer", "preview", "checkout"];

/** Public, human-readable URL step values — e.g. /theorthodoxmuslim?step=lesson */
const FLOW_TO_URL_STEP: Record<FlowStep, string> = {
  offer:    "overview",
  preview:  "lesson",
  checkout: "plans",
};
const URL_STEP_TO_FLOW: Record<string, FlowStep> = {
  overview: "offer",
  lesson:   "preview",
  plans:    "checkout",
};

/** Invalid or missing step values safely fall back to the overview screen. */
function parseUrlStep(raw: string | null): FlowStep {
  if (!raw) return "offer";
  return URL_STEP_TO_FLOW[raw] ?? "offer";
}

// ── Reduced-motion hook ──────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Component ────────────────────────────────────────────────────────────────

interface InfluencerQuickCheckoutProps {
  config: InfluencerConfig;
  part1: Part | null;
  part1AssetUrls: Part1AssetUrls;
  isAuthenticated: boolean;
  userEmail?: string;
}

function InfluencerQuickCheckoutInner({
  config,
  part1,
  part1AssetUrls,
  isAuthenticated,
  userEmail = "",
}: InfluencerQuickCheckoutProps) {
  const router       = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const reducedMotion = useReducedMotion();

  const step      = parseUrlStep(searchParams.get("step"));
  const stepIndex = STEP_ORDER.indexOf(step);

  const [paymentIntentId, setPiId]    = useState<string | undefined>();
  const [redirecting, setRedirecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);
  // Steps the user has actually seen — kept mounted (hidden) forever after
  // first visit so in-progress state (selected lesson tab, video position)
  // survives navigating away and back, regardless of the path taken.
  const [visitedSteps, setVisitedSteps] = useState<Set<FlowStep>>(() => new Set([step]));

  // True once we've pushed at least one history entry ourselves — lets the
  // "Back" affordance safely use the real browser history instead of
  // guessing, while still working correctly for direct/shared links.
  const hasNavigatedRef = useRef(false);

  // ── Attribution capture + page view ────────────────────────────────────────
  useEffect(() => {
    setClientMounted(true);
    captureAttribution();
    trackEvent(
      "influencer_landing_view",
      { influencer_slug: config.slug, page_variant: "quick_checkout" },
      { creator: config.slug }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track visited steps + per-screen "viewed" analytics ─────────────────────
  useEffect(() => {
    setVisitedSteps((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
    if (step === "checkout") {
      trackEvent(
        "pricing_screen_viewed",
        { influencer_slug: config.slug },
        { creator: config.slug }
      );
    }
  }, [step, config.slug]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const pushStep = useCallback((next: FlowStep) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", FLOW_TO_URL_STEP[next]);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    hasNavigatedRef.current = true;
  }, [pathname, searchParams, router]);

  const goBack = useCallback(() => {
    const prevStep = STEP_ORDER[Math.max(0, stepIndex - 1)];
    trackEvent(
      "checkout_back_clicked",
      { influencer_slug: config.slug, from_step: step, to_step: prevStep },
      { allowDuplicates: true, creator: config.slug }
    );
    if (hasNavigatedRef.current) {
      router.back();
    } else {
      pushStep(prevStep);
    }
  }, [config.slug, step, stepIndex, router, pushStep]);

  /** Progress-indicator clicks always jump to the exact target step. */
  const goToStep = useCallback((target: FlowStep) => {
    pushStep(target);
  }, [pushStep]);

  // ── Event handlers ──────────────────────────────────────────────────────────
  const goToPreview = useCallback(() => {
    trackEvent(
      "influencer_free_preview_clicked",
      { influencer_slug: config.slug, trigger: "offer_step" },
      { creator: config.slug }
    );
    pushStep("preview");
  }, [config.slug, pushStep]);

  const skipToPlans = useCallback(() => {
    trackEvent(
      "influencer_direct_plans_clicked",
      { influencer_slug: config.slug, trigger: "offer_step" },
      { creator: config.slug }
    );
    pushStep("checkout");
  }, [config.slug, pushStep]);

  const onPreviewContinue = useCallback(() => {
    trackEvent(
      "influencer_primary_cta_clicked",
      { influencer_slug: config.slug, plan: "individual-monthly", trigger: "preview_step" },
      { creator: config.slug }
    );
    pushStep("checkout");
  }, [config.slug, pushStep]);

  const onPaymentSuccess = useCallback((piId: string) => {
    setPiId(piId);
    setShowSuccess(true);
  }, []);

  const onPaymentRedirecting = useCallback(() => setRedirecting(true), []);

  // ── Step positioning ────────────────────────────────────────────────────────
  function stepStyle(target: FlowStep): React.CSSProperties {
    const targetIdx = STEP_ORDER.indexOf(target);
    const offset    = (targetIdx - stepIndex) * 100;
    return {
      position:     "absolute",
      top:           0,
      left:          0,
      width:         "100%",
      height:        "100%",
      transform:     reducedMotion ? "none" : `translateX(${offset}%)`,
      transition:    reducedMotion ? "none" : "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
      opacity:       reducedMotion ? 1 : (offset === 0 ? 1 : 0.4),
      visibility:    Math.abs(offset) > 100 ? "hidden" : "visible",
      pointerEvents: offset === 0 ? "auto" : "none",
    };
  }

  // ── Redirect overlay (3DS / bank redirect) ──────────────────────────────────
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

  // ── Success (terminal — not part of the 3-step progress/slide system) ──────
  if (showSuccess) {
    return <SuccessStep config={config} paymentIntentId={paymentIntentId} />;
  }

  // Mount the checkout Stripe form one step early (when preview is active)
  // so it has time to load in the background.
  const shouldMountCheckout = clientMounted && stepIndex >= STEP_ORDER.indexOf("preview");

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-background text-text flex flex-col">
      <FunnelProgress current={step} onNavigate={goToStep} />

      {/* Clip container — all steps are absolutely positioned inside */}
      <div className="relative overflow-x-hidden flex-1 min-h-0">

        {/* Offer */}
        <div style={stepStyle("offer")} aria-hidden={step !== "offer"}>
          <OfferStep
            config={config}
            onContinue={goToPreview}
            onSkipToPlans={skipToPlans}
          />
        </div>

        {/* Preview — stays mounted (hidden) once visited so the selected
            lesson tab and video progress survive navigating away and back. */}
        <div style={stepStyle("preview")} aria-hidden={step !== "preview"}>
          {visitedSteps.has("preview") && (
            <PreviewStep
              config={config}
              part={part1}
              initialAssetUrls={part1AssetUrls}
              onBack={goBack}
              onContinue={onPreviewContinue}
            />
          )}
        </div>

        {/* Checkout */}
        <div style={stepStyle("checkout")} aria-hidden={step !== "checkout"}>
          {shouldMountCheckout && (
            <CheckoutStep
              config={config}
              isAuthenticated={isAuthenticated}
              userEmail={userEmail}
              onBack={goBack}
              onSuccess={onPaymentSuccess}
              onRedirecting={onPaymentRedirecting}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default function InfluencerQuickCheckout(props: InfluencerQuickCheckoutProps) {
  return (
    <Suspense fallback={null}>
      <InfluencerQuickCheckoutInner {...props} />
    </Suspense>
  );
}
