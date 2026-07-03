/**
 * Canonical click analytics for plan selection and checkout initiation.
 * All marketing pages should route [data-track] plan/checkout clicks through here.
 */

import { trackEvent } from "@/lib/analytics";
import { attributionToProps, getAttribution } from "@/lib/attribution";
import { startCheckoutAttempt } from "@/lib/checkout-attempt";
import {
  buildInteractionKey,
  consumeInteractionSlot,
  INTERACTION_DEDUP_MS,
} from "@/lib/interaction-dedup";
import { planAnalyticsProps } from "@/lib/plan-catalog";

export type FunnelClickContext = {
  creator: string;
  /** Identifies which mounted tracker delegated the click (for dev logs). */
  handlerScope: string;
  attrProps?: Record<string, unknown>;
};

function mergedAttr(ctx: FunnelClickContext): Record<string, unknown> {
  const attribution = getAttribution();
  return {
    ...attributionToProps(attribution),
    ...(ctx.attrProps ?? {}),
  };
}

function devAssertPlanSelected(
  handlerScope: string,
  el: HTMLElement,
  planId: string,
  props: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.info("[Analytics assert] plan_selected", {
    handler: handlerScope,
    target: el.tagName.toLowerCase(),
    track: el.dataset.track,
    plan_id: planId,
    id: el.id || null,
    className: el.className?.slice(0, 80) || null,
    props,
  });
}

function devAssertCheckoutClicked(
  handlerScope: string,
  el: HTMLElement,
  planId: string | null,
  props: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.info("[Analytics assert] checkout_clicked", {
    handler: handlerScope,
    target: el.tagName.toLowerCase(),
    track: el.dataset.track,
    plan_id: planId,
    id: el.id || null,
    className: el.className?.slice(0, 80) || null,
    props,
  });
}

function targetKey(el: HTMLElement): string {
  return `${el.dataset.track ?? ""}:${el.dataset.plan ?? ""}:${el.id ?? ""}`;
}

function isUserActivation(event: MouseEvent): boolean {
  if (!event.isTrusted) return false;
  if (event.button !== 0 && event.type === "click") return false;
  return true;
}

/** Fire exactly one plan_selected for an explicit user click on a plan control. */
export function trackPlanSelectedFromClick(
  event: MouseEvent,
  el: HTMLElement,
  ctx: FunnelClickContext
): boolean {
  if (!isUserActivation(event)) return false;

  const rawPlan = el.dataset.plan ?? undefined;
  const planProps = planAnalyticsProps(rawPlan);
  const planId = String(planProps.plan_id ?? "unknown");

  const dedupKey = buildInteractionKey("plan_selected", planId, event, targetKey(el));
  if (!consumeInteractionSlot(dedupKey, INTERACTION_DEDUP_MS)) return false;

  const props = {
    ...mergedAttr(ctx),
    ...planProps,
    interaction_id: dedupKey,
    handler: ctx.handlerScope,
    element_track: el.dataset.track ?? null,
  };

  devAssertPlanSelected(ctx.handlerScope, el, planId, props);

  trackEvent("plan_selected", props, { creator: ctx.creator });
  return true;
}

/** Fire exactly one checkout_clicked and mint/reuse checkout_attempt_id. */
export function trackCheckoutClickedFromClick(
  event: MouseEvent,
  el: HTMLElement,
  ctx: FunnelClickContext & { trigger?: string; forceNewAttempt?: boolean }
): boolean {
  if (!isUserActivation(event)) return false;

  const rawPlan = el.dataset.plan ?? undefined;
  const planProps = planAnalyticsProps(rawPlan);
  const planId = String(planProps.plan_id ?? "unknown");

  const dedupKey = buildInteractionKey("checkout_clicked", planId, event, targetKey(el));
  if (!consumeInteractionSlot(dedupKey, INTERACTION_DEDUP_MS)) return false;

  const attempt = startCheckoutAttempt(rawPlan, {
    forceNew: ctx.forceNewAttempt,
    source: ctx.creator,
  });

  const props = {
    ...mergedAttr(ctx),
    ...planProps,
    checkout_attempt_id: attempt.checkout_attempt_id,
    interaction_id: dedupKey,
    handler: ctx.handlerScope,
    trigger: ctx.trigger ?? el.dataset.track ?? "checkout_clicked",
    element_track: el.dataset.track ?? null,
  };

  devAssertCheckoutClicked(ctx.handlerScope, el, planId === "unknown" ? null : planId, props);

  trackEvent("checkout_clicked", props, { creator: ctx.creator });
  return true;
}

const PLAN_TRACK_VALUES = new Set(["plan_selected", "plan_card_click"]);
const CHECKOUT_TRACK_VALUES = new Set([
  "checkout_clicked",
  "selected_plan_checkout_click",
  "checkout_start",
  "hero_cta_checkout_click",
  "after_part1_checkout_click",
  "final_checkout_clicked",
]);

/**
 * Handle canonical plan/checkout clicks from delegated [data-track] listeners.
 * Returns true when the event was consumed (callers should skip legacy aliases).
 */
export function handleCanonicalFunnelClick(
  event: MouseEvent,
  ctx: FunnelClickContext
): boolean {
  const el = (event.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
  if (!el) return false;
  const track = el.dataset.track;
  if (!track) return false;

  const rawPlan = el.dataset.plan ?? undefined;
  const planProps = planAnalyticsProps(rawPlan);
  const planId = String(planProps.plan_id ?? "unknown");

  if (PLAN_TRACK_VALUES.has(track)) {
    return trackPlanSelectedFromClick(event, el, ctx);
  }

  if (CHECKOUT_TRACK_VALUES.has(track)) {
    const ok = trackCheckoutClickedFromClick(event, el, {
      ...ctx,
      trigger: track,
    });
    if (ok && track === "hero_cta_checkout_click") {
      trackEvent("hero_cta_checkout_click", {}, { creator: ctx.creator });
      trackEvent("homepage_primary_cta_click", {}, { creator: ctx.creator });
    }
    if (ok && track === "final_checkout_clicked") {
      trackEvent("final_checkout_clicked", { plan_id: planId }, { creator: ctx.creator });
    }
    if (ok && track === "selected_plan_checkout_click") {
      trackEvent("selected_plan_checkout_click", { plan: rawPlan }, { creator: ctx.creator });
      trackEvent("checkout_start", { plan: rawPlan }, { creator: ctx.creator });
    }
    if (ok && track === "after_part1_checkout_click") {
      trackEvent("after_part1_checkout_click", {}, { creator: ctx.creator });
    }
    return ok;
  }

  return false;
}
