import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBlockedEmail } from "@/lib/email-automation";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/outreach/leads
 *
 * Query params (all optional, default false):
 *   verifiedOnly=1   — only users with emailVerified = true
 *   noPlanOnly=1     — exclude users who have any paid access
 *   neverEmailed=1   — exclude users who already received NO_PLAN_MANUAL
 *   excludeTest=1    — exclude blocked emails / domains
 *   page=N           — 1-indexed page (default 1)
 *   limit=N          — rows per page (default 100, max 500)
 */
export async function GET(req: NextRequest) {
  await requireAdmin();

  const sp           = req.nextUrl.searchParams;
  const verifiedOnly = sp.get("verifiedOnly") === "1";
  const noPlanOnly   = sp.get("noPlanOnly")   === "1";
  const neverEmailed = sp.get("neverEmailed") === "1";
  const excludeTest  = sp.get("excludeTest")  === "1";
  const page  = Math.max(1, parseInt(sp.get("page")  ?? "1", 10));
  const limit = Math.min(500, Math.max(1, parseInt(sp.get("limit") ?? "100", 10)));
  const skip  = (page - 1) * limit;

  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role:     { not: "admin" },
      ...(verifiedOnly ? { emailVerified: true } : {}),
      ...(noPlanOnly ? {
        hasPaid: false,
        purchases:     { none: { status: "succeeded" } },
        subscriptions: { none: { status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES], currentPeriodEnd: { gte: now } } as never } },
      } : {}),
      ...(neverEmailed ? {
        emailOutreachLogs: { none: { outreachType: "NO_PLAN_MANUAL" } },
      } : {}),
    },
    select: {
      id:            true,
      fullName:      true,
      email:         true,
      emailVerified: true,
      hasPaid:       true,
      createdAt:     true,
      purchases: {
        where:   { status: "succeeded" },
        select:  { id: true, planName: true },
        take:    1,
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        select:  { status: true, currentPeriodEnd: true },
        take:    1,
        orderBy: { createdAt: "desc" },
      },
      emailOutreachLogs: {
        where:   { outreachType: "NO_PLAN_MANUAL" },
        select:  { status: true, sentAt: true },
        take:    1,
        orderBy: { sentAt: "desc" },
      },
      emailAutomationEvents: {
        where:   { flowType: "NO_PLAN_RECOVERY" },
        select:  { step: true, status: true, sentAt: true },
        orderBy: { sentAt: "desc" },
        take:    2,
      },
      activityLogs: {
        where:   { activityType: "checkout_page_loaded" },
        select:  { metadataJson: true },
        take:    1,
        orderBy: { createdAt: "desc" },
      },
    },
    skip,
    take:    limit,
    orderBy: { createdAt: "desc" },
  });

  // Collect all emails for unsubscribe check in one query
  const emails = users.map((u) => u.email);
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where:  { email: { in: emails } },
    select: { email: true },
  });
  const unsubSet = new Set(unsubscribed.map((u) => u.email));

  // Resolve per-user active paid access (fast path using hasPaid + subscription rows)
  const enriched = users.map((u) => {
    const activeSub = u.subscriptions[0];
    const isSubActive = activeSub
      ? (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(activeSub.status) &&
        activeSub.currentPeriodEnd >= now
      : false;

    const hasPaidAccess = u.hasPaid || u.purchases.length > 0 || isSubActive;

    const lastManualLog  = u.emailOutreachLogs[0];
    const lastAutoEvents = u.emailAutomationEvents;

    const source = (() => {
      try {
        const meta = u.activityLogs[0]?.metadataJson;
        if (!meta) return null;
        const parsed = JSON.parse(meta) as Record<string, string>;
        return parsed.source ?? parsed.utm_source ?? null;
      } catch {
        return null;
      }
    })();

    const blockReason = excludeTest ? isBlockedEmail(u.email) : null;

    return {
      id:            u.id,
      fullName:      u.fullName,
      email:         u.email,
      emailVerified: u.emailVerified,
      hasPaidAccess,
      planLabel:     u.purchases[0]?.planName ?? (isSubActive ? "Monthly" : null),
      lastManualSent: lastManualLog?.sentAt ?? null,
      lastManualStatus: lastManualLog?.status ?? null,
      autoStep1Sent: lastAutoEvents.find((e) => e.step === 1)?.sentAt ?? null,
      autoStep2Sent: lastAutoEvents.find((e) => e.step === 2)?.sentAt ?? null,
      unsubscribed:  unsubSet.has(u.email),
      source,
      createdAt:     u.createdAt,
      blockReason,
    };
  });

  const total = await prisma.user.count({
    where: {
      isActive: true,
      role:     { not: "admin" },
      ...(verifiedOnly ? { emailVerified: true } : {}),
      ...(noPlanOnly ? {
        hasPaid: false,
        purchases:     { none: { status: "succeeded" } },
      } : {}),
      ...(neverEmailed ? {
        emailOutreachLogs: { none: { outreachType: "NO_PLAN_MANUAL" } },
      } : {}),
    },
  });

  return NextResponse.json({ leads: enriched, total, page, limit });
}
