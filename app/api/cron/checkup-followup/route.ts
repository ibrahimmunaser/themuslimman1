import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBlockedEmail } from "@/lib/email-automation";
import { sendCheckupFollowupEmail, type CheckupLeadForEmail } from "@/lib/checkup-email-automation";

export const dynamic    = "force-dynamic";
export const maxDuration = 60;

const FLOW_TYPE = "CHECKUP_FOLLOWUP";
const BATCH     = 50;

// Time windows — upper bound prevents stale emails to leads who fell through cracks
const STEP1_MIN_MS  =  2 * 60 * 60 * 1000; //  2 hours
const STEP1_MAX_MS  = 48 * 60 * 60 * 1000; // 48 hours
const STEP2_MIN_MS  = 24 * 60 * 60 * 1000; // 24 hours
const STEP2_MAX_MS  = 96 * 60 * 60 * 1000; // 96 hours
const STEP3_MIN_MS  = 72 * 60 * 60 * 1000; // 72 hours
const STEP3_MAX_MS  = 168 * 60 * 60 * 1000; // 7 days
const STEP4_MIN_MS  =  1 * 60 * 60 * 1000; //  1 hour after checkout click
const STEP4_MAX_MS  = 72 * 60 * 60 * 1000; // 72 hours

const SUBJECTS: Record<number, string> = {
  1: "Your Seerah score", // Step 1 is dynamic; see getSubject()
  2: "Most Muslims learn the Seerah out of order",
  3: "The plan we recommended for you",
  4: "You were close — your checkout is still open",
};

function getSubject(step: number, lead: { score: number }): string {
  if (step === 1) return `Your Seerah score: ${lead.score}/100`;
  return SUBJECTS[step] ?? "Your Seerah journey";
}

function requireCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Deliberately loud: a missing secret means the cron will silently 401 on
    // every invocation. Log at startup so it shows in Vercel function logs.
    console.error("[CRON] CRON_SECRET is not set — all cron requests will be rejected. Set this env var in Vercel dashboard.");
    return false;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Returns true if the lead has paid or has active course access.
 * Checks:
 *   1. lead.purchasedAt (stamped by Stripe webhook on any plan purchase)
 *   2. user.hasPaid     (lifetime purchases set this flag)
 *   3. Active Stripe subscription (monthly/trial subscribers — hasPaid stays false for them)
 */
async function hasPurchased(email: string, leadPurchasedAt?: Date | null): Promise<boolean> {
  // Fastest check: webhook already stamped the lead row
  if (leadPurchasedAt) return true;

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      hasPaid: true,
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!user) return false;
  if (user.hasPaid) return true;
  if (user.subscriptions.length > 0) return true;
  return false;
}

/** Check if email is unsubscribed in EmailUnsubscribe. */
async function isUnsubscribed(email: string): Promise<boolean> {
  const row = await prisma.emailUnsubscribe.findUnique({ where: { email } });
  return row?.unsubscribed ?? false;
}

async function processSend(
  lead: CheckupLeadForEmail,
  step: 1 | 2 | 3 | 4,
  dryRun: boolean,
  results: { eligible: number; sent: number; skipped: number; failed: number },
) {
  results.eligible++;

  // Blocked / test email
  if (isBlockedEmail(lead.email)) {
    results.skipped++;
    return;
  }

  // Already purchased (check lead.purchasedAt first — avoids extra DB lookup)
  if (await hasPurchased(lead.email, lead.purchasedAt)) {
    results.skipped++;
    if (!dryRun) {
      await prisma.checkupEmailEvent.upsert({
        where:  { leadId_flowType_step: { leadId: lead.id, flowType: FLOW_TYPE, step } },
        create: { id: crypto.randomUUID(), leadId: lead.id, email: lead.email, flowType: FLOW_TYPE, step, subject: getSubject(step, lead), status: "SKIPPED" },
        update: { status: "SKIPPED" },
      });
    }
    return;
  }

  // Unsubscribed
  if (await isUnsubscribed(lead.email)) {
    results.skipped++;
    if (!dryRun) {
      await prisma.checkupEmailEvent.upsert({
        where:  { leadId_flowType_step: { leadId: lead.id, flowType: FLOW_TYPE, step } },
        create: { id: crypto.randomUUID(), leadId: lead.id, email: lead.email, flowType: FLOW_TYPE, step, subject: getSubject(step, lead), status: "SKIPPED" },
        update: { status: "SKIPPED" },
      });
    }
    return;
  }

  if (dryRun) { results.sent++; return; }

  try {
    await sendCheckupFollowupEmail(lead, step);
    await prisma.checkupEmailEvent.create({
      data: {
        id:       crypto.randomUUID(),
        leadId:   lead.id,
        email:    lead.email,
        flowType: FLOW_TYPE,
        step,
        subject:  getSubject(step, lead),
        status:   "SENT",
        sentAt:   new Date(),
      },
    });
    results.sent++;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CHECKUP_FOLLOWUP] Step ${step} failed for ${lead.email}:`, message);
    await prisma.checkupEmailEvent.upsert({
      where:  { leadId_flowType_step: { leadId: lead.id, flowType: FLOW_TYPE, step } },
      create: { id: crypto.randomUUID(), leadId: lead.id, email: lead.email, flowType: FLOW_TYPE, step, subject: getSubject(step, lead), status: "FAILED", error: message },
      update: { status: "FAILED", error: message },
    });
    results.failed++;
  }
}

/**
 * GET /api/cron/checkup-followup
 *
 * Runs hourly via Vercel Cron. Sends the 4-step Seerah Checkup follow-up
 * sequence to leads who completed the quiz but did not purchase.
 *
 * Step 1: 2–48h after quiz (score reminder)
 * Step 2: 24–96h after quiz (educational, requires step 1 sent)
 * Step 3: 72h–7d after quiz (plan recommendation, requires step 2 sent)
 * Step 4: 1–72h after checkout click (checkout recovery, independent)
 *
 * Query params:
 *   ?dryRun=1      — compute eligible leads but do not send or write DB rows
 *   ?step=1|2|3|4  — run only a specific step
 */
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun    = req.nextUrl.searchParams.get("dryRun") === "1";
  const stepParam = req.nextUrl.searchParams.get("step");
  const now       = new Date();

  const results = {
    step1: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    step2: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    step3: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    step4: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
  };

  const leadSelect = {
    id: true, email: true, name: true, score: true, resultType: true,
    recommendedPlan: true, mainObjection: true, audienceType: true, source: true,
    purchasedAt: true,
  } as const;

  // ── Step 1: 2h reminder ─────────────────────────────────────────────────────
  if (!stepParam || stepParam === "1") {
    const min = new Date(now.getTime() - STEP1_MAX_MS);
    const max = new Date(now.getTime() - STEP1_MIN_MS);

    const leads = await prisma.seerahCheckupLead.findMany({
      where: {
        createdAt: { gte: min, lte: max },
        // Only block on terminal statuses — FAILED rows are retryable.
        checkupEmailEvents: { none: { flowType: FLOW_TYPE, step: 1, status: { in: ["SENT", "SKIPPED"] } } },
      },
      select: leadSelect,
      take: BATCH,
      orderBy: { createdAt: "asc" },
    });

    for (const lead of leads) {
      await processSend(lead, 1, dryRun, results.step1);
    }
  }

  // ── Step 2: 24h educational (requires step 1 sent) ─────────────────────────
  if (!stepParam || stepParam === "2") {
    const min = new Date(now.getTime() - STEP2_MAX_MS);
    const max = new Date(now.getTime() - STEP2_MIN_MS);

    const step1Events = await prisma.checkupEmailEvent.findMany({
      where: {
        flowType: FLOW_TYPE,
        step:     1,
        status:   "SENT",
        sentAt:   { lte: max },
        lead: {
          createdAt: { gte: min },
          checkupEmailEvents: { none: { flowType: FLOW_TYPE, step: 2, status: { in: ["SENT", "SKIPPED"] } } },
        },
      },
      include: { lead: { select: leadSelect } },
      take: BATCH,
      orderBy: { sentAt: "asc" },
    });

    for (const event of step1Events) {
      await processSend(event.lead, 2, dryRun, results.step2);
    }
  }

  // ── Step 3: 72h plan recommendation (requires step 2 sent) ─────────────────
  if (!stepParam || stepParam === "3") {
    const min = new Date(now.getTime() - STEP3_MAX_MS);
    const max = new Date(now.getTime() - STEP3_MIN_MS);

    const step2Events = await prisma.checkupEmailEvent.findMany({
      where: {
        flowType: FLOW_TYPE,
        step:     2,
        status:   "SENT",
        sentAt:   { lte: max },
        lead: {
          createdAt: { gte: min },
          checkupEmailEvents: { none: { flowType: FLOW_TYPE, step: 3, status: { in: ["SENT", "SKIPPED"] } } },
        },
      },
      include: { lead: { select: leadSelect } },
      take: BATCH,
      orderBy: { sentAt: "asc" },
    });

    for (const event of step2Events) {
      await processSend(event.lead, 3, dryRun, results.step3);
    }
  }

  // ── Step 4: checkout recovery (1h after checkout click) ─────────────────────
  if (!stepParam || stepParam === "4") {
    const clickMin = new Date(now.getTime() - STEP4_MAX_MS);
    const clickMax = new Date(now.getTime() - STEP4_MIN_MS);

    const leads = await prisma.seerahCheckupLead.findMany({
      where: {
        checkoutClickedAt: { gte: clickMin, lte: clickMax },
        checkupEmailEvents: { none: { flowType: FLOW_TYPE, step: 4, status: { in: ["SENT", "SKIPPED"] } } },
      },
      select: leadSelect,
      take: BATCH,
      orderBy: { checkoutClickedAt: "asc" },
    });

    for (const lead of leads) {
      await processSend(lead, 4, dryRun, results.step4);
    }
  }

  console.log(`[CHECKUP_FOLLOWUP] ${dryRun ? "DRY RUN " : ""}Results:`, results);
  return NextResponse.json({ ok: true, dryRun, ...results });
}
