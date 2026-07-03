/**
 * Funnel Events admin aggregation — distinct visitors for funnel steps,
 * raw counts for diagnostic tables, attempt-based checkout metrics post-deploy.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  getCheckoutAnalyticsData,
  CHECKOUT_ANALYTICS_REPORTING_START,
} from "@/lib/queries/checkout-analytics";

export const FUNNEL_CREATORS = [
  "homepage",
  "theorthodoxmuslim",
  "deenresponds",
  "browniesaadi",
  "community",
  "annarbor",
  "dearborn",
] as const;

export const CREATOR_LABELS: Record<string, string> = {
  homepage: "Homepage (main + checkup)",
  theorthodoxmuslim: "The Orthodox Muslim",
  deenresponds: "Deen Responds",
  browniesaadi: "Brownie Saadi",
  community: "Community",
  annarbor: "Ann Arbor Students",
  dearborn: "Dearborn Community",
};

export const CHECKOUT_RAW_EVENTS = [
  "checkout_loaded",
  "payment_started",
  "checkout_payment_started",
  "payment_submitted",
  "payment_method_selected",
  "payment_succeeded",
  "purchase_completed",
  "payment_failed",
  "express_checkout_visible",
  "payment_element_loaded",
  "checkout_abandoned",
  "checkout_escape_clicked",
  "payment_skipped_already_has_access",
] as const;

const QUIZ_FUNNEL_EVENTS = [
  "quiz_started",
  "quiz_completed",
  "quiz_email_submitted",
  "quiz_recommended_cta_clicked",
  "quiz_abandoned",
] as const;

export type QuizFunnelRow = {
  creator: string;
  visitors: number;
  leads: number;
  started: number;
  completed: number;
  emails: number;
  ctaClick: number;
  abandoned: number;
  checkoutSessions: number;
  purchases: number;
  /** Post-deploy attempt-based metrics (checkout_v3 window) */
  v3CheckoutAttempts: number;
  v3Purchases: number;
};

export type FunnelEventsData = {
  totalEvents: number;
  totalVisitors: number;
  totalLeads: number;
  quizFunnels: QuizFunnelRow[];
  rawByCreator: Record<string, Record<string, number>>;
  rawEventTypes: Array<{ eventType: string; total: number; byCreator: Record<string, number> }>;
  checkoutRawByCreator: Record<string, Record<string, number>>;
  recentEvents: Array<{
    id: string;
    creator: string;
    eventType: string;
    sessionId: string;
    route: string | null;
    plan: string | null;
    createdAt: Date;
  }>;
  checkoutReportingStart: Date;
};

export function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

export async function getFunnelEventsData(): Promise<FunnelEventsData> {
  const eventCounts = await prisma.influencerEvent.groupBy({
    by: ["creator", "eventType"],
    _count: { _all: true },
    orderBy: { creator: "asc" },
  });

  const rawByCreator: Record<string, Record<string, number>> = {};
  for (const row of eventCounts) {
    if (!rawByCreator[row.creator]) rawByCreator[row.creator] = {};
    rawByCreator[row.creator][row.eventType] = row._count._all;
  }

  const rawVisitors = await prisma.$queryRaw<{ creator: string; visitors: bigint }[]>`
    SELECT creator, COUNT(DISTINCT "visitorId") AS visitors
    FROM "InfluencerEvent"
    GROUP BY creator
  `;
  const visitorMap: Record<string, number> = {};
  for (const r of rawVisitors) visitorMap[r.creator] = Number(r.visitors);

  const totalVisitorsRow = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COUNT(DISTINCT "visitorId") AS total FROM "InfluencerEvent"
  `;
  const totalVisitors = Number(totalVisitorsRow[0]?.total ?? 0);

  const funnelEventTypes = [
    ...QUIZ_FUNNEL_EVENTS,
    "checkout_loaded",
    "purchase_completed",
  ];

  const distinctRows = await prisma.$queryRaw<
    { creator: string; eventType: string; visitors: bigint; sessions: bigint }[]
  >(Prisma.sql`
    SELECT creator,
           "eventType",
           COUNT(DISTINCT "visitorId") AS visitors,
           COUNT(DISTINCT "sessionId") AS sessions
    FROM "InfluencerEvent"
    WHERE "eventType" IN (${Prisma.join(funnelEventTypes.map((e) => Prisma.sql`${e}`))})
    GROUP BY creator, "eventType"
  `);

  const distinctVisitors: Record<string, Record<string, number>> = {};
  const distinctSessions: Record<string, Record<string, number>> = {};
  for (const r of distinctRows) {
    if (!distinctVisitors[r.creator]) distinctVisitors[r.creator] = {};
    if (!distinctSessions[r.creator]) distinctSessions[r.creator] = {};
    distinctVisitors[r.creator][r.eventType] = Number(r.visitors);
    distinctSessions[r.creator][r.eventType] = Number(r.sessions);
  }

  const leadsBySource = await prisma.seerahCheckupLead.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const leadSourceMap: Record<string, number> = {};
  for (const r of leadsBySource) {
    leadSourceMap[r.source ?? "unknown"] = r._count._all;
  }

  const checkoutAnalytics = await getCheckoutAnalyticsData();
  const v3BySource = Object.fromEntries(
    checkoutAnalytics.breakdownBySource.map((r) => [r.source, r])
  );

  const quizFunnels: QuizFunnelRow[] = FUNNEL_CREATORS.map((creator) => ({
    creator,
    visitors: visitorMap[creator] ?? 0,
    leads: leadSourceMap[creator] ?? 0,
    started: distinctVisitors[creator]?.quiz_started ?? 0,
    completed: distinctVisitors[creator]?.quiz_completed ?? 0,
    emails: distinctVisitors[creator]?.quiz_email_submitted ?? 0,
    ctaClick: distinctVisitors[creator]?.quiz_recommended_cta_clicked ?? 0,
    abandoned: distinctVisitors[creator]?.quiz_abandoned ?? 0,
    checkoutSessions: distinctSessions[creator]?.checkout_loaded ?? 0,
    purchases: distinctSessions[creator]?.purchase_completed ?? 0,
    v3CheckoutAttempts: v3BySource[creator]?.loaded ?? 0,
    v3Purchases: v3BySource[creator]?.purchased ?? 0,
  }));

  const checkoutRawByCreator: Record<string, Record<string, number>> = {};
  for (const creator of FUNNEL_CREATORS) {
    checkoutRawByCreator[creator] = {};
    for (const event of CHECKOUT_RAW_EVENTS) {
      checkoutRawByCreator[creator][event] = rawByCreator[creator]?.[event] ?? 0;
    }
  }

  const eventTypeSet = new Set(eventCounts.map((r) => r.eventType));
  const rawEventTypes = [...eventTypeSet]
    .map((eventType) => {
      const byCreator: Record<string, number> = {};
      let total = 0;
      for (const creator of FUNNEL_CREATORS) {
        const n = rawByCreator[creator]?.[eventType] ?? 0;
        if (n) byCreator[creator] = n;
        total += n;
      }
      return { eventType, total, byCreator };
    })
    .sort((a, b) => b.total - a.total);

  const recentEvents = await prisma.influencerEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      creator: true,
      eventType: true,
      sessionId: true,
      route: true,
      plan: true,
      createdAt: true,
    },
  });

  const totalEvents = eventCounts.reduce((s, r) => s + r._count._all, 0);
  const totalLeads = Object.values(leadSourceMap).reduce((s, v) => s + v, 0);

  return {
    totalEvents,
    totalVisitors,
    totalLeads,
    quizFunnels,
    rawByCreator,
    rawEventTypes,
    checkoutRawByCreator,
    recentEvents,
    checkoutReportingStart: CHECKOUT_ANALYTICS_REPORTING_START,
  };
}
