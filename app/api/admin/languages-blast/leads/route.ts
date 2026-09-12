import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBlockedEmail } from "@/lib/email-automation";
import { LANGUAGES_LAUNCH_OUTREACH_TYPE } from "@/lib/languages-launch-email";

/**
 * GET /api/admin/languages-blast/leads
 * Distinct contact pool: registered users + checkup/quiz leads.
 */
export async function GET() {
  await requireAdmin();

  const [users, leads, unsubs, alreadySent] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        isAnonymous: false,
        role: { not: "admin" },
        email: { not: "" },
      },
      select: { id: true, email: true, fullName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.seerahCheckupLead.findMany({
      where: {
        email: { not: "" },
        unsubscribedAt: null,
      },
      select: { id: true, email: true, name: true, createdAt: true, source: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailUnsubscribe.findMany({
      where: { unsubscribed: true },
      select: { email: true },
    }),
    prisma.emailOutreachLog.findMany({
      where: { outreachType: LANGUAGES_LAUNCH_OUTREACH_TYPE, status: "SENT" },
      select: { email: true },
    }),
  ]);

  const unsubSet = new Set(unsubs.map((u) => u.email.toLowerCase()));
  const sentSet = new Set(alreadySent.map((s) => s.email.toLowerCase()));

  type Row = {
    email: string;
    name: string;
    userId?: string;
    source: string;
    createdAt: string;
    blockReason: string | null;
    alreadySent: boolean;
    unsubscribed: boolean;
  };

  const byEmail = new Map<string, Row>();

  for (const u of users) {
    const email = u.email.toLowerCase();
    const block = isBlockedEmail(email);
    byEmail.set(email, {
      email,
      name: u.fullName || "",
      userId: u.id,
      source: "account",
      createdAt: u.createdAt.toISOString(),
      blockReason: block,
      alreadySent: sentSet.has(email),
      unsubscribed: unsubSet.has(email),
    });
  }

  for (const l of leads) {
    const email = l.email.toLowerCase();
    if (byEmail.has(email)) continue;
    const block = isBlockedEmail(email);
    byEmail.set(email, {
      email,
      name: l.name || "",
      source: l.source ? `quiz:${l.source}` : "quiz",
      createdAt: l.createdAt.toISOString(),
      blockReason: block,
      alreadySent: sentSet.has(email),
      unsubscribed: unsubSet.has(email),
    });
  }

  const recipients = [...byEmail.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const eligible = recipients.filter(
    (r) => !r.blockReason && !r.unsubscribed && !r.alreadySent,
  );

  return NextResponse.json({
    total: recipients.length,
    eligible: eligible.length,
    alreadySent: recipients.filter((r) => r.alreadySent).length,
    unsubscribed: recipients.filter((r) => r.unsubscribed).length,
    blocked: recipients.filter((r) => !!r.blockReason).length,
    recipients,
  });
}
