import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/access";
import { sendNoPlanRecoveryEmail, isBlockedEmail } from "@/lib/email-automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FLOW_TYPE = "NO_PLAN_RECOVERY";
const BATCH_LIMIT = 50;

// Time thresholds
const STEP_1_DELAY_MS  = 3  * 60 * 60 * 1000; // 3 hours after signup
const STEP_2_DELAY_MS  = 24 * 60 * 60 * 1000; // 24 hours after step 1

function requireCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never allow if secret not configured
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

/** Returns true if the user has any form of paid access (lifetime, subscription, mobile). */
async function userHasPaidAccess(userId: string): Promise<boolean> {
  return hasActiveCourseAccess(userId, false);
}

/**
 * GET /api/cron/no-plan-recovery
 *
 * Runs every hour via Vercel Cron. Sends the 2-step no-plan recovery sequence
 * to users who verified their email but never purchased any plan.
 *
 * Step 1: 3 hours after email verification, if no paid access.
 * Step 2: 24 hours after Step 1 email was sent, if still no paid access.
 *
 * Query params:
 *   ?dryRun=1   — compute eligible users but do not send or write DB rows
 *   ?step=1|2   — run only a specific step
 */
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const stepParam = req.nextUrl.searchParams.get("step");
  const runStep1  = !stepParam || stepParam === "1";
  const runStep2  = !stepParam || stepParam === "2";

  const now        = new Date();
  const results    = { step1: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
                       step2: { eligible: 0, sent: 0, skipped: 0, failed: 0 } };

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  // Eligible: verified account created ≥3h ago, no prior step-1 event.
  if (runStep1) {
    const step1Cutoff = new Date(now.getTime() - STEP_1_DELAY_MS);

    // Users with verified email, account old enough, and no step-1 log yet.
    const candidates = await prisma.user.findMany({
      where: {
        emailVerified: true,
        isActive: true,
        createdAt: { lte: step1Cutoff },
        // Exclude internal/test accounts by role
        role: { not: "admin" },
        // Exclude users who already have step-1 or step-2 event
        emailAutomationEvents: {
          none: { flowType: FLOW_TYPE },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        hasPaid: true,
        createdAt: true,
      },
      take: BATCH_LIMIT,
      orderBy: { createdAt: "asc" },
    });

    results.step1.eligible = candidates.length;

    for (const user of candidates) {
      // Skip blocked/test emails.
      if (isBlockedEmail(user.email)) {
        results.step1.skipped++;
        continue;
      }

      // Skip if they already have paid access.
      const hasPaid = await userHasPaidAccess(user.id);
      if (hasPaid) {
        results.step1.skipped++;
        if (!dryRun) {
          await prisma.emailAutomationEvent.upsert({
            where: { userId_flowType_step: { userId: user.id, flowType: FLOW_TYPE, step: 1 } },
            create: {
              id: crypto.randomUUID(),
              userId: user.id,
              email:  user.email,
              flowType: FLOW_TYPE,
              step:    1,
              subject: "The first lesson is unlocked",
              status:  "SKIPPED",
            },
            update: { status: "SKIPPED" },
          });
        }
        continue;
      }

      if (dryRun) {
        results.step1.sent++; // would send
        continue;
      }

      try {
        await sendNoPlanRecoveryEmail({
          userId: user.id,
          email:  user.email,
          fullName: user.fullName,
          step: 1,
        });
        await prisma.emailAutomationEvent.create({
          data: {
            id:       crypto.randomUUID(),
            userId:   user.id,
            email:    user.email,
            flowType: FLOW_TYPE,
            step:     1,
            subject:  "The first lesson is unlocked",
            status:   "SENT",
            sentAt:   new Date(),
          },
        });
        results.step1.sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[NO_PLAN_RECOVERY] Step 1 failed for ${user.email}:`, message);
        await prisma.emailAutomationEvent.upsert({
          where: { userId_flowType_step: { userId: user.id, flowType: FLOW_TYPE, step: 1 } },
          create: {
            id:       crypto.randomUUID(),
            userId:   user.id,
            email:    user.email,
            flowType: FLOW_TYPE,
            step:     1,
            subject:  "The first lesson is unlocked",
            status:   "FAILED",
            error:    message,
          },
          update: { status: "FAILED", error: message },
        });
        results.step1.failed++;
      }
    }
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  // Eligible: step-1 was SENT ≥24h ago, no step-2 event yet.
  if (runStep2) {
    const step2Cutoff = new Date(now.getTime() - STEP_2_DELAY_MS);

    const step1Events = await prisma.emailAutomationEvent.findMany({
      where: {
        flowType: FLOW_TYPE,
        step:     1,
        status:   "SENT",
        sentAt:   { lte: step2Cutoff },
        // No step-2 event yet for this user
        user: {
          emailAutomationEvents: {
            none: { flowType: FLOW_TYPE, step: 2 },
          },
          isActive: true,
          role: { not: "admin" },
        },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, hasPaid: true } },
      },
      take: BATCH_LIMIT,
      orderBy: { sentAt: "asc" },
    });

    results.step2.eligible = step1Events.length;

    for (const event of step1Events) {
      const user = event.user;

      // Skip blocked/test emails.
      if (isBlockedEmail(user.email)) {
        results.step2.skipped++;
        continue;
      }

      const hasPaid = await userHasPaidAccess(user.id);
      if (hasPaid) {
        results.step2.skipped++;
        if (!dryRun) {
          await prisma.emailAutomationEvent.upsert({
            where: { userId_flowType_step: { userId: user.id, flowType: FLOW_TYPE, step: 2 } },
            create: {
              id:       crypto.randomUUID(),
              userId:   user.id,
              email:    user.email,
              flowType: FLOW_TYPE,
              step:     2,
              subject:  "Most Muslims learn scattered stories",
              status:   "SKIPPED",
            },
            update: { status: "SKIPPED" },
          });
        }
        continue;
      }

      if (dryRun) {
        results.step2.sent++;
        continue;
      }

      try {
        await sendNoPlanRecoveryEmail({
          userId:   user.id,
          email:    user.email,
          fullName: user.fullName,
          step: 2,
        });
        await prisma.emailAutomationEvent.create({
          data: {
            id:       crypto.randomUUID(),
            userId:   user.id,
            email:    user.email,
            flowType: FLOW_TYPE,
            step:     2,
            subject:  "Most Muslims learn scattered stories",
            status:   "SENT",
            sentAt:   new Date(),
          },
        });
        results.step2.sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[NO_PLAN_RECOVERY] Step 2 failed for ${user.email}:`, message);
        await prisma.emailAutomationEvent.upsert({
          where: { userId_flowType_step: { userId: user.id, flowType: FLOW_TYPE, step: 2 } },
          create: {
            id:       crypto.randomUUID(),
            userId:   user.id,
            email:    user.email,
            flowType: FLOW_TYPE,
            step:     2,
            subject:  "Most Muslims learn scattered stories",
            status:   "FAILED",
            error:    message,
          },
          update: { status: "FAILED", error: message },
        });
        results.step2.failed++;
      }
    }
  }

  console.log(`[NO_PLAN_RECOVERY] ${dryRun ? "DRY RUN " : ""}Results:`, results);

  return NextResponse.json({
    ok: true,
    dryRun,
    ...results,
  });
}
