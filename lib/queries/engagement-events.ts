/**
 * In-app learning engagement admin aggregation.
 *
 * Covers the post-purchase/in-app event set added to /api/influencer/track
 * (lesson viewing, video/audio/text/slides/quiz/flashcard interaction,
 * navigation, classroom activity, account/retention actions). These share
 * the same InfluencerEvent table as the marketing/checkout funnel data on
 * /admin/funnel-events, but are a distinct event namespace — query them
 * separately so the two don't get mixed in aggregation.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const ENGAGEMENT_LOOKBACK_DAYS = 30;

// ── Event groupings (for display sectioning) ───────────────────────────────

export const PAGE_VIEW_EVENTS = [
  "dashboard_viewed",
  "lesson_viewed",
  "resources_viewed",
  "timeline_viewed",
  "progress_viewed",
  "settings_viewed",
  "certificate_viewed",
  "classes_viewed",
  "quizzes_list_viewed",
  "billing_viewed",
  "profile_picker_viewed",
] as const;

export const CONTENT_EVENTS = [
  "video_watch_started",
  "video_watch_progress",
  "video_watch_completed",
  "video_playback_rate_changed",
  "content_read",
  "content_read_completed",
  "slides_viewed",
  "slides_fullscreen_opened",
  "slides_completed",
  "audio_started",
  "audio_completed",
  "mindmap_viewed",
  "flashcards_started",
  "flashcard_level_switched",
] as const;

export const QUIZ_EVENTS = [
  "quiz_cta_clicked",
  "lesson_quiz_started",
  "lesson_quiz_question_answered",
  "lesson_quiz_completed",
] as const;

export const NAV_EVENTS = [
  "lesson_nav_link_clicked",
  "lesson_tab_viewed",
  "lesson_subtab_viewed",
  "dashboard_tab_viewed",
  "sidebar_nav_clicked",
  "resources_tab_switched",
  "course_language_changed",
] as const;

export const CLASSROOM_EVENTS = [
  "class_joined",
  "class_join_failed",
  "class_lesson_marked_complete",
  "class_quiz_started",
  "class_quiz_submitted",
  "class_quiz_abandoned",
] as const;

export const PROFILE_EVENTS = [
  "profile_created",
  "profile_switched",
] as const;

export const RETENTION_EVENTS = [
  "sign_out_clicked",
  "password_changed",
  "password_change_failed",
  "share_popup_shown",
  "share_popup_dismissed",
  "share_clicked",
  "welcome_tour_started",
  "welcome_tour_completed",
  "welcome_tour_skipped",
] as const;

export const BILLING_EVENTS = [
  "billing_portal_clicked",
  "subscription_cancel_initiated",
  "subscription_cancel_abandoned",
  "subscription_cancelled",
  "subscription_cancel_failed",
  "subscription_reactivated",
  "subscription_reactivate_failed",
] as const;

export const ALL_ENGAGEMENT_EVENTS = [
  ...PAGE_VIEW_EVENTS,
  ...CONTENT_EVENTS,
  ...QUIZ_EVENTS,
  ...NAV_EVENTS,
  ...CLASSROOM_EVENTS,
  ...PROFILE_EVENTS,
  ...RETENTION_EVENTS,
  ...BILLING_EVENTS,
] as const;

export type EngagementSection = {
  title: string;
  rows: Array<{ eventType: string; total: number; sessions: number }>;
};

export type DailyPoint = { date: string; count: number };

export type EngagementData = {
  totalEvents: number;
  totalSessions: number;
  totalUniqueParts: number;
  sections: EngagementSection[];
  topParts: Array<{ partNumber: number; views: number }>;
  dailyLessonViews: DailyPoint[];
  dailyVideoStarts: DailyPoint[];
  videoFunnel: { started: number; completed: number };
  readFunnel: { started: number; completed: number };
  quizFunnel: { started: number; completed: number };
  welcomeTourFunnel: { started: number; completed: number; skipped: number };
  cancelFunnel: { initiated: number; abandoned: number; cancelled: number };
  recentEvents: Array<{
    id: string;
    eventType: string;
    route: string | null;
    createdAt: Date;
    metadata: string | null;
  }>;
  lookbackDays: number;
};

export async function getEngagementData(): Promise<EngagementData> {
  const since = new Date(Date.now() - ENGAGEMENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // ── Raw counts + distinct sessions per event type (all-time) ─────────────
  const counts = await prisma.influencerEvent.groupBy({
    by: ["eventType"],
    where: { eventType: { in: [...ALL_ENGAGEMENT_EVENTS] } },
    _count: { _all: true },
  });
  const totalByType: Record<string, number> = {};
  for (const row of counts) totalByType[row.eventType] = row._count._all;

  const sessionRows = await prisma.$queryRaw<{ eventType: string; sessions: bigint }[]>(Prisma.sql`
    SELECT "eventType", COUNT(DISTINCT "sessionId") AS sessions
    FROM "InfluencerEvent"
    WHERE "eventType" IN (${Prisma.join(ALL_ENGAGEMENT_EVENTS.map((e) => Prisma.sql`${e}`))})
    GROUP BY "eventType"
  `);
  const sessionsByType: Record<string, number> = {};
  for (const r of sessionRows) sessionsByType[r.eventType] = Number(r.sessions);

  function buildSection(title: string, events: readonly string[]): EngagementSection {
    return {
      title,
      rows: events.map((eventType) => ({
        eventType,
        total: totalByType[eventType] ?? 0,
        sessions: sessionsByType[eventType] ?? 0,
      })),
    };
  }

  const sections: EngagementSection[] = [
    buildSection("Page views", PAGE_VIEW_EVENTS),
    buildSection("Content engagement", CONTENT_EVENTS),
    buildSection("Quizzes", QUIZ_EVENTS),
    buildSection("Navigation", NAV_EVENTS),
    buildSection("Classroom", CLASSROOM_EVENTS),
    buildSection("Profiles", PROFILE_EVENTS),
    buildSection("Account & retention", RETENTION_EVENTS),
    buildSection("Billing & churn", BILLING_EVENTS),
  ];

  const totalEvents = Object.values(totalByType).reduce((s, v) => s + v, 0);

  const totalSessionsRow = await prisma.$queryRaw<[{ total: bigint }]>(Prisma.sql`
    SELECT COUNT(DISTINCT "sessionId") AS total
    FROM "InfluencerEvent"
    WHERE "eventType" IN (${Prisma.join(ALL_ENGAGEMENT_EVENTS.map((e) => Prisma.sql`${e}`))})
  `);
  const totalSessions = Number(totalSessionsRow[0]?.total ?? 0);

  // ── Top parts by lesson_viewed (parses part_number out of the JSON metadata) ─
  const topPartsRows = await prisma.$queryRaw<{ part_number: number; views: bigint }[]>(Prisma.sql`
    SELECT (metadata::jsonb->>'part_number')::int AS part_number, COUNT(*) AS views
    FROM "InfluencerEvent"
    WHERE "eventType" = 'lesson_viewed'
      AND metadata IS NOT NULL
      AND (metadata::jsonb->>'part_number') IS NOT NULL
    GROUP BY part_number
    ORDER BY views DESC
    LIMIT 10
  `);
  const topParts = topPartsRows.map((r) => ({ partNumber: r.part_number, views: Number(r.views) }));

  const totalUniquePartsRow = await prisma.$queryRaw<[{ total: bigint }]>(Prisma.sql`
    SELECT COUNT(DISTINCT (metadata::jsonb->>'part_number')) AS total
    FROM "InfluencerEvent"
    WHERE "eventType" = 'lesson_viewed' AND metadata IS NOT NULL
  `);
  const totalUniqueParts = Number(totalUniquePartsRow[0]?.total ?? 0);

  // ── Daily trend (last N days) for two headline events ────────────────────
  async function dailySeries(eventType: string): Promise<DailyPoint[]> {
    const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "InfluencerEvent"
      WHERE "eventType" = ${eventType} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `);
    return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), count: Number(r.count) }));
  }

  const [dailyLessonViews, dailyVideoStarts] = await Promise.all([
    dailySeries("lesson_viewed"),
    dailySeries("video_watch_started"),
  ]);

  // ── Simple step funnels (distinct sessions, all-time) ─────────────────────
  async function sessionCount(eventType: string): Promise<number> {
    return sessionsByType[eventType] ?? 0;
  }

  const videoFunnel = {
    started: await sessionCount("video_watch_started"),
    completed: await sessionCount("video_watch_completed"),
  };
  const readFunnel = {
    started: await sessionCount("content_read"),
    completed: await sessionCount("content_read_completed"),
  };
  const quizFunnel = {
    started: await sessionCount("lesson_quiz_started"),
    completed: await sessionCount("lesson_quiz_completed"),
  };
  const welcomeTourFunnel = {
    started: await sessionCount("welcome_tour_started"),
    completed: await sessionCount("welcome_tour_completed"),
    skipped: await sessionCount("welcome_tour_skipped"),
  };
  const cancelFunnel = {
    initiated: await sessionCount("subscription_cancel_initiated"),
    abandoned: await sessionCount("subscription_cancel_abandoned"),
    cancelled: await sessionCount("subscription_cancelled"),
  };

  const recentEvents = await prisma.influencerEvent.findMany({
    where: { eventType: { in: [...ALL_ENGAGEMENT_EVENTS] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, eventType: true, route: true, createdAt: true, metadata: true },
  });

  return {
    totalEvents,
    totalSessions,
    totalUniqueParts,
    sections,
    topParts,
    dailyLessonViews,
    dailyVideoStarts,
    videoFunnel,
    readFunnel,
    quizFunnel,
    welcomeTourFunnel,
    cancelFunnel,
    recentEvents,
    lookbackDays: ENGAGEMENT_LOOKBACK_DAYS,
  };
}

export function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}
