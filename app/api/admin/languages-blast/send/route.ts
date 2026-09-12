import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBlockedEmail } from "@/lib/email-automation";
import {
  LANGUAGES_LAUNCH_OUTREACH_TYPE,
  LANGUAGES_LAUNCH_SUBJECT,
  sendLanguagesLaunchEmail,
} from "@/lib/languages-launch-email";

const BATCH_LIMIT = 50;
const BATCH_DELAY = 200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Recipient {
  userId?: string;
  email: string;
  name: string;
}

/**
 * POST /api/admin/languages-blast/send
 * Body: { recipients: Recipient[]; dryRun?: boolean; override?: boolean }
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.recipients)) {
    return NextResponse.json({ error: "recipients array required" }, { status: 400 });
  }

  const recipients: Recipient[] = body.recipients.slice(0, BATCH_LIMIT);
  const dryRun = !!body.dryRun;
  const override = !!body.override;

  const results: Array<{
    email: string;
    name: string;
    status: "SENT" | "FAILED" | "SKIPPED";
    reason?: string;
    error?: string;
  }> = [];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of recipients) {
    const email = r.email.toLowerCase();
    const block = isBlockedEmail(email);
    if (block) {
      results.push({ email, name: r.name, status: "SKIPPED", reason: block });
      skipped++;
      continue;
    }

    const unsub = await prisma.emailUnsubscribe.findUnique({
      where: { email },
      select: { unsubscribed: true },
    });
    if (unsub?.unsubscribed) {
      results.push({ email, name: r.name, status: "SKIPPED", reason: "unsubscribed" });
      skipped++;
      continue;
    }

    if (!override) {
      const existing = await prisma.emailOutreachLog.findFirst({
        where: {
          email,
          outreachType: LANGUAGES_LAUNCH_OUTREACH_TYPE,
          status: "SENT",
        },
      });
      if (existing) {
        results.push({
          email,
          name: r.name,
          status: "SKIPPED",
          reason: "already received LANGUAGES_LAUNCH",
        });
        skipped++;
        continue;
      }
    }

    if (dryRun) {
      results.push({ email, name: r.name, status: "SENT", reason: "dry-run" });
      sent++;
      continue;
    }

    try {
      await sendLanguagesLaunchEmail({ email, fullName: r.name });
      await prisma.emailOutreachLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: r.userId,
          name: r.name,
          email,
          outreachType: LANGUAGES_LAUNCH_OUTREACH_TYPE,
          subject: LANGUAGES_LAUNCH_SUBJECT,
          status: "SENT",
        },
      });
      results.push({ email, name: r.name, status: "SENT" });
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send failed";
      await prisma.emailOutreachLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: r.userId,
          name: r.name,
          email,
          outreachType: LANGUAGES_LAUNCH_OUTREACH_TYPE,
          subject: LANGUAGES_LAUNCH_SUBJECT,
          status: "FAILED",
          error: msg,
        },
      });
      results.push({ email, name: r.name, status: "FAILED", error: msg });
      failed++;
    }

    await sleep(BATCH_DELAY);
  }

  return NextResponse.json({ dryRun, sent, failed, skipped, results });
}
