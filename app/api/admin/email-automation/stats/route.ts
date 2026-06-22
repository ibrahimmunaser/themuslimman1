import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FLOW_TYPE    = "NO_PLAN_RECOVERY";
const STEP_1_DELAY = 3  * 60 * 60 * 1000;
const STEP_2_DELAY = 24 * 60 * 60 * 1000;
const ACTIVE_SUB   = ["active", "trialing"] as const;

export async function GET() {
  await requireAdmin();

  const now = new Date();

  const [
    totalSentStep1,
    totalSentStep2,
    totalFailed,
    totalSkipped,
    autoRecentLogs,
    manualSent,
    manualFailed,
    manualRecentLogs,
    totalNonPurchasers,
    uncontactedNonPurchasers,
  ] = await Promise.all([
    // Auto step 1 sent
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, step: 1, status: "SENT" } }),
    // Auto step 2 sent
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, step: 2, status: "SENT" } }),
    // Auto failed
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, status: "FAILED" } }),
    // Auto skipped
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, status: "SKIPPED" } }),
    // Auto recent logs (50)
    prisma.emailAutomationEvent.findMany({
      where:   { flowType: FLOW_TYPE },
      orderBy: { sentAt: "desc" },
      take:    50,
      select: { id: true, email: true, step: true, status: true, subject: true, sentAt: true, error: true },
    }),
    // Manual outreach sent
    prisma.emailOutreachLog.count({ where: { status: "SENT" } }),
    // Manual outreach failed
    prisma.emailOutreachLog.count({ where: { status: "FAILED" } }),
    // Manual outreach recent logs (50)
    prisma.emailOutreachLog.findMany({
      orderBy: { createdAt: "desc" },
      take:    50,
      select: { id: true, email: true, status: true, subject: true, sentAt: true, error: true, createdAt: true },
    }),
    // Total non-purchasers (signed up, no paid access, verified)
    prisma.user.count({
      where: {
        role: "student",
        emailVerified: true,
        isActive: true,
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB] } } },
      },
    }),
    // Non-purchasers never emailed by ANY flow
    prisma.user.count({
      where: {
        role: "student",
        emailVerified: true,
        isActive: true,
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB] } } },
        emailAutomationEvents: { none: {} },
        emailOutreachLogs:     { none: {} },
      },
    }),
  ]);

  // Eligible step-1 (same logic as cron)
  const step1Cutoff = new Date(now.getTime() - STEP_1_DELAY);
  const [step1Candidates, paidStep1] = await Promise.all([
    prisma.user.count({
      where: {
        emailVerified: true,
        isActive: true,
        createdAt: { lte: step1Cutoff },
        role: { not: "admin" },
        emailAutomationEvents: { none: { flowType: FLOW_TYPE } },
      },
    }),
    prisma.user.count({
      where: {
        emailVerified: true,
        isActive: true,
        createdAt: { lte: step1Cutoff },
        role: { not: "admin" },
        emailAutomationEvents: { none: { flowType: FLOW_TYPE } },
        OR: [
          { hasPaid: true },
          { subscriptions: { some: { status: { in: [...ACTIVE_SUB] } } } },
        ],
      },
    }),
  ]);

  // Eligible step-2
  const step2Cutoff = new Date(now.getTime() - STEP_2_DELAY);
  const step2Candidates = await prisma.emailAutomationEvent.count({
    where: {
      flowType: FLOW_TYPE,
      step:     1,
      status:   "SENT",
      sentAt:   { lte: step2Cutoff },
      user: {
        emailAutomationEvents: { none: { flowType: FLOW_TYPE, step: 2 } },
        isActive: true,
        role: { not: "admin" },
      },
    },
  });

  // Merge and sort auto + manual logs into one unified feed
  type UnifiedLog = {
    id:      string;
    email:   string;
    source:  "automation" | "manual";
    step:    number | null;
    status:  string;
    subject: string | null;
    sentAt:  string;
    error:   string | null;
  };

  const autoLogs: UnifiedLog[] = autoRecentLogs.map((l) => ({
    id:      l.id,
    email:   l.email,
    source:  "automation",
    step:    l.step,
    status:  l.status,
    subject: l.subject,
    sentAt:  (l.sentAt ?? new Date()).toISOString(),
    error:   l.error,
  }));

  const manualLogs: UnifiedLog[] = manualRecentLogs.map((l) => ({
    id:      l.id,
    email:   l.email,
    source:  "manual",
    step:    null,
    status:  l.status,
    subject: l.subject ?? null,
    sentAt:  (l.sentAt ?? l.createdAt).toISOString(),
    error:   l.error,
  }));

  const recentLogs = [...autoLogs, ...manualLogs]
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 100);

  return NextResponse.json({
    // Auto-flow stats
    eligibleStep1:  Math.max(0, step1Candidates - paidStep1),
    eligibleStep2:  step2Candidates,
    totalSentStep1,
    totalSentStep2,
    totalFailed,
    totalSkipped,
    // Manual outreach stats
    manualSent,
    manualFailed,
    // Totals across both flows
    totalEmailsSent: totalSentStep1 + totalSentStep2 + manualSent,
    // Non-purchaser reach
    totalNonPurchasers,
    uncontactedNonPurchasers,
    // Unified log feed
    recentLogs,
  });
}
