import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/access";

const FLOW_TYPE    = "NO_PLAN_RECOVERY";
const STEP_1_DELAY = 3  * 60 * 60 * 1000;
const STEP_2_DELAY = 24 * 60 * 60 * 1000;

export async function GET() {
  await requireAdmin();

  const now = new Date();

  const [
    totalSentStep1,
    totalSentStep2,
    totalFailed,
    totalSkipped,
    recentLogs,
  ] = await Promise.all([
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, step: 1, status: "SENT" } }),
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, step: 2, status: "SENT" } }),
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, status: "FAILED" } }),
    prisma.emailAutomationEvent.count({ where: { flowType: FLOW_TYPE, status: "SKIPPED" } }),
    prisma.emailAutomationEvent.findMany({
      where:   { flowType: FLOW_TYPE },
      orderBy: { sentAt: "desc" },
      take:    50,
      select: { id: true, email: true, step: true, status: true, subject: true, sentAt: true, error: true },
    }),
  ]);

  // Count Step-1 eligible (same query as cron but count only)
  const step1Cutoff = new Date(now.getTime() - STEP_1_DELAY);
  const step1Candidates = await prisma.user.count({
    where: {
      emailVerified: true,
      isActive: true,
      createdAt: { lte: step1Cutoff },
      role: { not: "admin" },
      emailAutomationEvents: { none: { flowType: FLOW_TYPE } },
    },
  });

  // Count Step-2 eligible
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

  // For the eligible counts, subtract users who now have paid access
  // (expensive to do exactly, so we estimate against DB flags only for the panel)
  const paidStep1 = await prisma.user.count({
    where: {
      emailVerified: true,
      isActive: true,
      createdAt: { lte: step1Cutoff },
      role: { not: "admin" },
      emailAutomationEvents: { none: { flowType: FLOW_TYPE } },
      OR: [
        { hasPaid: true },
        { subscriptions: { some: { status: { in: ["active", "trialing"] } } } },
      ],
    },
  });

  return NextResponse.json({
    eligibleStep1:  Math.max(0, step1Candidates - paidStep1),
    eligibleStep2:  step2Candidates,
    totalSentStep1,
    totalSentStep2,
    totalFailed,
    totalSkipped,
    recentLogs,
  });
}
