import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBlockedEmail, sendManualOutreachEmail } from "@/lib/email-automation";
import { hasActiveCourseAccess } from "@/lib/access";

const BATCH_LIMIT   = 50;
const BATCH_DELAY   = 200; // ms between sends to protect deliverability
const OUTREACH_TYPE = "NO_PLAN_MANUAL";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Recipient {
  userId?: string;
  email:  string;
  name:   string;
}

interface SendResult {
  email:  string;
  name:   string;
  status: "SENT" | "FAILED" | "SKIPPED";
  reason?: string;
  error?:  string;
}

async function checkEligibility(r: Recipient, override: boolean): Promise<string | null> {
  // Blocked email check
  const block = isBlockedEmail(r.email);
  if (block) return block;

  // Unsubscribed
  const unsub = await prisma.emailUnsubscribe.findUnique({ where: { email: r.email } });
  if (unsub) return "unsubscribed";

  // Already emailed (unless override)
  if (!override) {
    const existing = await prisma.emailOutreachLog.findFirst({
      where: { email: r.email, outreachType: OUTREACH_TYPE, status: "SENT" },
    });
    if (existing) return "already received NO_PLAN_MANUAL";
  }

  // Paid access
  if (r.userId) {
    const paid = await hasActiveCourseAccess(r.userId);
    if (paid) return "has active paid access";
  }

  return null;
}

/**
 * POST /api/admin/outreach/send
 *
 * Body:
 * {
 *   recipients: { userId?: string; email: string; name: string }[]
 *   dryRun?: boolean
 *   override?: boolean   — skip "already emailed" guard
 * }
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.recipients)) {
    return NextResponse.json({ error: "recipients array required" }, { status: 400 });
  }

  const recipients: Recipient[] = body.recipients.slice(0, BATCH_LIMIT);
  const dryRun:  boolean = !!body.dryRun;
  const override: boolean = !!body.override;

  const results: SendResult[] = [];
  let sent = 0, failed = 0, skipped = 0;

  for (const r of recipients) {
    const skipReason = await checkEligibility(r, override);
    if (skipReason) {
      results.push({ email: r.email, name: r.name, status: "SKIPPED", reason: skipReason });
      skipped++;

      if (!dryRun) {
        await prisma.emailOutreachLog.upsert({
          where: {
            // use a composed unique on email+outreachType — emulate with findFirst + create
            // (no unique constraint on those two together, so we just create always for SKIPPED)
            id: `${r.email}-${OUTREACH_TYPE}-skip-${Date.now()}`,
          },
          create: {
            id:          crypto.randomUUID(),
            userId:      r.userId,
            name:        r.name,
            email:       r.email,
            outreachType: OUTREACH_TYPE,
            subject:     "The first lesson is unlocked",
            status:      "SKIPPED",
            error:       skipReason,
          },
          update: {},
        });
      }
      continue;
    }

    if (dryRun) {
      results.push({ email: r.email, name: r.name, status: "SENT" });
      sent++;
      continue;
    }

    try {
      await sendManualOutreachEmail({ userId: r.userId, email: r.email, fullName: r.name });

      await prisma.emailOutreachLog.create({
        data: {
          id:          crypto.randomUUID(),
          userId:      r.userId,
          name:        r.name,
          email:       r.email,
          outreachType: OUTREACH_TYPE,
          subject:     "The first lesson is unlocked",
          status:      "SENT",
          sentAt:      new Date(),
        },
      });

      results.push({ email: r.email, name: r.name, status: "SENT" });
      sent++;
      await sleep(BATCH_DELAY);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await prisma.emailOutreachLog.create({
        data: {
          id:          crypto.randomUUID(),
          userId:      r.userId,
          name:        r.name,
          email:       r.email,
          outreachType: OUTREACH_TYPE,
          subject:     "The first lesson is unlocked",
          status:      "FAILED",
          error:       message,
        },
      });

      results.push({ email: r.email, name: r.name, status: "FAILED", error: message });
      failed++;
    }
  }

  return NextResponse.json({ dryRun, sent, failed, skipped, results });
}
