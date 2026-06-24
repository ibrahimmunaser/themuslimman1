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

const KNOWN_EVENT_TYPES = [
  // v1 events (kept for backward compat)
  "landing_view",
  "hero_cta_clicked",
  "hero_preview_clicked",
  "pricing_viewed",
  "trial_cta_clicked",
  "lifetime_cta_clicked",
  "checkout_started",
  "checkout_loaded",
  "checkout_form_submitted",
  // v2 simplified funnel events
  "brownie_landing_page_view",
  "landing_page_view",
  "pricing_viewed",
  // Ann Arbor student funnel events
  "annarbor_landing_page_view",
  "student_lifetime_cta_clicked",
  "checkout_loaded_student_lifetime",
  "individual_lifetime_cta_clicked",
  "family_lifetime_cta_clicked",
  "watch_part1_clicked",
  "checkout_loaded_individual_lifetime",
  "checkout_loaded_family_lifetime",
  "change_plan_clicked",
  "purchase_completed",
  // Payment failure events
  "checkout_payment_failed",
  // Seerah Checkup quiz funnel
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
  // Checkout funnel v3
  "payment_started",
  "payment_submitted",
  "payment_method_selected",
  "payment_succeeded",
  "payment_failed",
  "payment_skipped_already_has_access",
  "checkout_abandoned",
  "checkout_escape_clicked",
  "express_checkout_visible",
  "payment_element_loaded",
  // Checkout detailed analytics
  "payment_method_available",
  "checkout_field_interacted",
  // Influencer direct landing page events
  "influencer_page_view",
  "influencer_primary_cta_click",
  "influencer_part1_cta_click",
  "influencer_part1_started",
  "influencer_offer_viewed",
  "influencer_checkout_viewed",
  "influencer_checkout_cta_click",
  "influencer_checkout_started",
  "influencer_purchase_completed",
  "optional_quiz_started",
  "optional_quiz_completed",
  // Homepage funnel
  "homepage_view",
  "homepage_primary_cta_click",
  "homepage_pricing_viewed",
  "homepage_part1_cta_click",
  "homepage_part1_bottom_cta_click",
  "homepage_checkout_started",
  "homepage_purchase_completed",
  // Legacy homepage events (kept for backward compat)
  "hero_watch_part1_clicked",
  "hero_score_clicked",
  "hero_card_watch_clicked",
  "part1_preview_viewed",
  "part1_play_clicked",
  "part1_continue_clicked",
  "plan_selected",
  "homepage_checkup_preprice_click",
  "final_watch_part1_clicked",
  "final_checkout_clicked",
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
