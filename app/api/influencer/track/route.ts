import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

const KNOWN_CREATORS = [
  "browniesaadi",
  "community",
  "deenresponds",
  "annarbor",
  "dearborn",
  "theorthodoxmuslim",
  "homepage",
  "korra",
  "itachi",
] as const;

/**
 * Event name registry for /api/influencer/track.
 *
 * CANONICAL EVENTS (v3) — use these in admin dashboards and funnels:
 *   landing_page_viewed        → replaces landing_page_view, influencer_page_view, homepage_view
 *   part_1_started             → replaces part1_video_start, influencer_part1_started
 *   part_1_progress            → replaces part1_video_50_percent, part1_video_90_percent
 *   pricing_viewed             → replaces pricing_view, homepage_pricing_viewed
 *   plan_selected              → replaces plan_card_click, selected_plan_checkout_click (selection step)
 *   checkout_clicked           → replaces checkout_start, hero_cta_checkout_click, after_part1_checkout_click
 *   checkout_loaded            → unchanged (page mount + Stripe init started)
 *   payment_element_loaded     → Stripe PaymentElement ready for input
 *   checkout_payment_started   → canonical alias for payment_started
 *   checkout_load_failed       → new: Stripe init failure
 *   payment_cancelled          → new: wallet sheet dismissed
 *   purchase_completed         → server-side only; replaces payment_succeeded (client)
 *   subscription_renewed       → renewal billing cycles (not initial purchase)
 *
 * LEGACY EVENTS — kept for backward compatibility with existing dashboard queries.
 *   Do not use legacy events in new funnel reports. They will be removed once
 *   all dashboards are migrated to canonical v3 names.
 */
const KNOWN_EVENT_TYPES = [
  // ── DEPRECATED v1 (do not use in new dashboards) ──────────────────────────
  "landing_view",             // → landing_page_viewed
  "hero_cta_clicked",         // → checkout_clicked
  "hero_preview_clicked",     // → part_1_started
  "trial_cta_clicked",        // removed
  "lifetime_cta_clicked",     // → checkout_clicked
  "checkout_started",         // → checkout_clicked
  "checkout_form_submitted",  // → checkout_payment_started
  // ── DEPRECATED v2 (do not use in new dashboards) ──────────────────────────
  "brownie_landing_page_view", // → landing_page_viewed
  "landing_page_view",         // → landing_page_viewed
  // ── Seerah Checkup quiz funnel (still active) ─────────────────────────────
  "quiz_started",
  "quiz_question_viewed",
  "quiz_question_answered",
  "quiz_progress_saved",
  "quiz_abandoned",
  "quiz_completed",
  "quiz_email_reveal_viewed",
  "quiz_email_submitted",
  "quiz_result_viewed",
  "quiz_recommended_cta_clicked",
  // ── Checkout funnel (still active — mix of legacy and v3) ─────────────────
  "checkout_loaded",
  "checkout_abandoned",
  "checkout_escape_clicked",
  "payment_started",          // legacy — use checkout_payment_started in new reports
  "payment_submitted",
  "payment_method_selected",
  "payment_method_presented",
  "payment_succeeded",        // legacy client-side — use purchase_completed (server-side)
  "payment_failed",
  "payment_skipped_already_has_access",
  "express_checkout_visible",
  "payment_element_loaded",
  "payment_method_available",
  "checkout_field_interacted",
  // ── Ann Arbor student funnel ──────────────────────────────────────────────
  "annarbor_landing_page_view",
  "student_lifetime_cta_clicked",
  "checkout_loaded_student_lifetime",
  "individual_lifetime_cta_clicked",
  "family_lifetime_cta_clicked",
  "watch_part1_clicked",
  "checkout_loaded_individual_lifetime",
  "checkout_loaded_family_lifetime",
  "change_plan_clicked",
  "checkout_payment_failed",
  // ── DEPRECATED influencer events (kept for stats dashboards) ──────────────
  "influencer_page_view",         // → landing_page_viewed
  "influencer_primary_cta_click", // → checkout_clicked
  "influencer_part1_cta_click",   // → part_1_started
  "influencer_part1_started",     // → part_1_started
  "influencer_offer_viewed",
  "influencer_checkout_viewed",
  "influencer_checkout_cta_click",
  "influencer_checkout_started",
  "influencer_purchase_completed",// → purchase_completed
  "optional_quiz_started",
  "optional_quiz_completed",
  // ── DEPRECATED homepage events (kept for stats dashboards) ────────────────
  "homepage_view",                // → landing_page_viewed
  "homepage_primary_cta_click",   // → checkout_clicked
  "homepage_pricing_viewed",      // → pricing_viewed
  "homepage_part1_cta_click",     // → part_1_started
  "homepage_part1_bottom_cta_click",
  "homepage_checkout_started",    // → checkout_clicked
  "homepage_purchase_completed",  // → purchase_completed
  // ── DEPRECATED homepage v2 events ─────────────────────────────────────────
  "hero_cta_checkout_click",      // → checkout_clicked
  "hero_watch_free_click",
  "pricing_view",                 // → pricing_viewed
  "plan_card_click",              // → plan_selected
  "selected_plan_checkout_click", // → checkout_clicked
  "checkout_start",               // → checkout_clicked
  "after_part1_checkout_click",   // → checkout_clicked
  // ── DEPRECATED Part 1 milestones ──────────────────────────────────────────
  "part1_video_start",            // → part_1_started
  "part1_video_50_percent",       // → part_1_progress { progress_percent: 50 }
  "part1_video_90_percent",       // → part_1_progress { progress_percent: 90/100 }
  "hero_watch_part1_clicked",
  "hero_score_clicked",
  "hero_card_watch_clicked",
  "part1_preview_viewed",
  "part1_play_clicked",           // → part_1_started
  "part1_continue_clicked",
  "plan_selected",                // overloaded name — kept for legacy; canonical is also plan_selected
  "homepage_checkup_preprice_click",
  "final_watch_part1_clicked",
  "final_checkout_clicked",       // → checkout_clicked
  // ── CANONICAL v3 (use these in all new dashboard queries) ─────────────────
  "landing_page_viewed",
  "part_1_started",
  "part_1_progress",
  "pricing_viewed",
  "checkout_clicked",
  "checkout_payment_started",
  "checkout_load_failed",
  "payment_cancelled",
  "purchase_completed",
  // ── Auth funnel ────────────────────────────────────────────────────────────
  "authentication_required",
  "signup_started",
  "signup_completed",
  "login_completed",
  "purchase_intent_resumed",
  // ── Subscription lifecycle ─────────────────────────────────────────────────
  "subscription_renewed",
] as const;

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    const rl = checkRateLimit(`inf_track:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const {
      creator,
      eventType,
      sessionId,
      visitorId,
      route,
      plan,
      promoCode,
      amount,
      userEmail,
      metadata,
    } = body as Record<string, unknown>;

    if (
      typeof creator !== "string" ||
      !KNOWN_CREATORS.includes(creator as (typeof KNOWN_CREATORS)[number])
    ) {
      return NextResponse.json({ ok: false, error: "invalid_creator" }, { status: 400 });
    }

    if (
      typeof eventType !== "string" ||
      !KNOWN_EVENT_TYPES.includes(eventType as (typeof KNOWN_EVENT_TYPES)[number])
    ) {
      return NextResponse.json({ ok: false, error: "invalid_event_type" }, { status: 400 });
    }

    if (typeof sessionId !== "string" || !sessionId || typeof visitorId !== "string" || !visitorId) {
      return NextResponse.json({ ok: false, error: "missing_ids" }, { status: 400 });
    }

    await prisma.influencerEvent.create({
      data: {
        id: nanoid(),
        creator,
        eventType,
        sessionId,
        visitorId,
        route: typeof route === "string" ? route : null,
        plan: typeof plan === "string" ? plan : null,
        promoCode: typeof promoCode === "string" ? promoCode : null,
        amount: typeof amount === "number" ? amount : null,
        userEmail: typeof userEmail === "string" ? userEmail : null,
        metadata: typeof metadata === "string" ? metadata : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[influencer/track] error:", err);
    return NextResponse.json({ ok: true });
  }
}
