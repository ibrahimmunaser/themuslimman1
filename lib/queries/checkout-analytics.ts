/**
 * Checkout analytics aggregation — attempt-based, post-deployment, consistent units.
 *
 * checkout_attempt_id is NOT stored historically; attempts are derived from
 * checkout_loaded anchors within a session (sessionId + plan + timestamp).
 */

import { prisma } from "@/lib/db";

/** Commit 5cfd08f — analytics overhaul deployed Jul 2, 2026 ~14:07 ET */
export const CHECKOUT_ANALYTICS_REPORTING_START = new Date("2026-07-02T18:07:31.000Z");
export const CHECKOUT_ANALYTICS_SCHEMA = "checkout_v3";

/** Max duration for attributing follow-up events to a checkout attempt */
const ATTEMPT_WINDOW_MS = 4 * 60 * 60 * 1000;

/** Max gap between plan_selected and checkout_loaded to link them in-session */
const PLAN_TO_CHECKOUT_MAX_MS = 24 * 60 * 60 * 1000;

const CHECKOUT_EVENT_TYPES = [
  "plan_selected",
  "checkout_clicked",
  "checkout_loaded",
  "payment_element_loaded",
  "payment_method_available",
  "payment_method_selected",
  "payment_started",
  "checkout_payment_started",
  "payment_submitted",
  "payment_succeeded",
  "purchase_completed",
  "payment_failed",
  "payment_cancelled",
  "checkout_abandoned",
  "checkout_escape_clicked",
  "checkout_field_interacted",
  "checkout_load_failed",
] as const;

export const PLAN_LABELS: Record<string, string> = {
  "individual-monthly": "Individual Monthly ($4.99/mo)",
  "individual-lifetime": "Individual Lifetime ($49)",
  "family-monthly": "Family Monthly ($9.99/mo)",
  "family-lifetime": "Family Lifetime ($99)",
  "individual-trial": "Individual Trial",
};

export const SOURCE_LABELS: Record<string, string> = {
  homepage: "Homepage",
  theorthodoxmuslim: "The Orthodox Muslim",
  deenresponds: "Deen Responds",
  browniesaadi: "Brownie Saadi",
  community: "Community",
  annarbor: "Ann Arbor",
  dearborn: "Dearborn",
};

type RawEvent = {
  id: string;
  eventType: string;
  creator: string;
  sessionId: string;
  visitorId: string;
  plan: string | null;
  metadata: string | null;
  createdAt: Date;
};

export type AbandonmentStage =
  | "before_payment_element_loaded"
  | "after_payment_element_loaded_before_payment_started"
  | "after_payment_started"
  | "payment_failed_not_recovered"
  | "payment_cancelled";

export type CheckoutAttempt = {
  id: string;
  sessionId: string;
  creator: string;
  plan: string;
  device: string;
  startedAt: Date;
  hasPlanSelectedBefore: boolean;
  hasCheckoutClicked: boolean;
  hasCheckoutLoaded: boolean;
  hasPaymentElementLoaded: boolean;
  hasPaymentMethodAvailable: boolean;
  /** Explicit user payment start (not auto Stripe presentation) */
  hasPaymentStarted: boolean;
  hasPurchaseCompleted: boolean;
  hasPaymentFailed: boolean;
  hasPaymentCancelled: boolean;
  hasCheckoutAbandoned: boolean;
  abandonmentStage: AbandonmentStage | null;
  paymentMethod: string | null;
};

function parseMeta(raw: string | null): Record<string, unknown> {
  try {
    return JSON.parse(raw ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizePlan(meta: Record<string, unknown>, rowPlan: string | null): string {
  const planType = typeof meta.plan_type === "string" ? meta.plan_type : "";
  const row =
    rowPlan && !rowPlan.startsWith("sub_") && !rowPlan.startsWith("pi_") ? rowPlan : null;
  const raw =
    (meta.selected_plan as string) ||
    (meta.plan as string) ||
    (meta.plan_id as string) ||
    row ||
    "unknown";

  const full = raw.match(/^(individual|family)-(monthly|lifetime|trial)$/);
  if (full) return full[0];

  if (raw === "monthly" || raw === "lifetime" || raw === "trial") {
    const tier = planType === "family" ? "family" : "individual";
    return `${tier}-${raw}`;
  }

  const name = String(meta.plan_name ?? "").toLowerCase();
  if (name.includes("family") && name.includes("monthly")) return "family-monthly";
  if (name.includes("family") && name.includes("lifetime")) return "family-lifetime";
  if (name.includes("individual") && name.includes("monthly")) return "individual-monthly";
  if (name.includes("individual") && name.includes("lifetime")) return "individual-lifetime";
  if (name.includes("monthly")) return planType === "family" ? "family-monthly" : "individual-monthly";
  if (name.includes("lifetime")) return planType === "family" ? "family-lifetime" : "individual-lifetime";

  return raw;
}

function eventBeforeAnchor(
  events: Array<{ eventType: string; creator: string; createdAt: Date }>,
  anchor: { creator: string; createdAt: Date },
  type: string,
  maxMs: number
): boolean {
  const anchorMs = anchor.createdAt.getTime();
  return events.some(
    (e) =>
      e.eventType === type &&
      e.creator === anchor.creator &&
      e.createdAt.getTime() <= anchorMs &&
      anchorMs - e.createdAt.getTime() <= maxMs
  );
}

function deviceFromMeta(meta: Record<string, unknown>): string | null {
  const d = meta.device_type;
  if (typeof d === "string" && d && d !== "unknown") return d;
  return null;
}

function isPostSchemaEvent(e: RawEvent, meta: Record<string, unknown>): boolean {
  const schema = meta.analytics_schema_version;
  if (typeof schema === "string" && schema !== CHECKOUT_ANALYTICS_SCHEMA) return false;
  return e.createdAt >= CHECKOUT_ANALYTICS_REPORTING_START;
}

function isPaymentStartedType(t: string): boolean {
  return t === "payment_started" || t === "checkout_payment_started";
}

function isPurchaseType(t: string): boolean {
  return t === "purchase_completed";
}

function resolveDevice(
  attemptEvents: { meta: Record<string, unknown> }[],
  sessionEvents: { meta: Record<string, unknown> }[]
): string {
  for (const e of attemptEvents) {
    const d = deviceFromMeta(e.meta);
    if (d) return d;
  }
  for (const e of sessionEvents) {
    const d = deviceFromMeta(e.meta);
    if (d) return d;
  }
  return "unknown";
}

function classifyAbandonment(attempt: Omit<CheckoutAttempt, "abandonmentStage">): AbandonmentStage | null {
  if (attempt.hasPurchaseCompleted) return null;
  if (!attempt.hasCheckoutLoaded) return null;
  if (attempt.hasPaymentCancelled) return "payment_cancelled";
  if (attempt.hasPaymentFailed) return "payment_failed_not_recovered";
  if (attempt.hasPaymentStarted) return "after_payment_started";
  if (attempt.hasPaymentElementLoaded) return "after_payment_element_loaded_before_payment_started";
  return "before_payment_element_loaded";
}

function buildAttempts(events: RawEvent[]): { attempts: CheckoutAttempt[]; unlinkedPurchases: number } {
  const parsed = events.map((e) => ({ ...e, meta: parseMeta(e.metadata) }));

  // Group by session
  const bySession = new Map<string, typeof parsed>();
  for (const e of parsed) {
    if (!e.sessionId) continue;
    const list = bySession.get(e.sessionId) ?? [];
    list.push(e);
    bySession.set(e.sessionId, list);
  }

  const attempts: CheckoutAttempt[] = [];

  for (const [sessionId, sessionEvents] of bySession) {
    sessionEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const planSelectedTimes = sessionEvents
      .filter((e) => e.eventType === "plan_selected")
      .map((e) => e.createdAt.getTime());

    const anchors = sessionEvents.filter((e) => e.eventType === "checkout_loaded");
    if (anchors.length === 0) continue;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const startMs = anchor.createdAt.getTime();
      const endMs =
        i + 1 < anchors.length
          ? anchors[i + 1].createdAt.getTime()
          : startMs + ATTEMPT_WINDOW_MS;

      const slice = sessionEvents.filter(
        (e) => e.createdAt.getTime() >= startMs && e.createdAt.getTime() < endMs
      );

      const plan = normalizePlan(anchor.meta, anchor.plan);
      const attemptId = `${sessionId}:${startMs}`;

      const hasPlanSelectedBefore =
        eventBeforeAnchor(parsed, anchor, "plan_selected", PLAN_TO_CHECKOUT_MAX_MS) ||
        planSelectedTimes.some(
          (t) => t <= startMs && startMs - t <= PLAN_TO_CHECKOUT_MAX_MS
        );

      const hasPaymentStarted = slice.some((e) => isPaymentStartedType(e.eventType));

      let hasPurchaseCompleted = slice.some((e) => isPurchaseType(e.eventType));

      const paymentMethod =
        (slice.find((e) => isPaymentStartedType(e.eventType))?.meta.payment_method as string) ||
        (slice.find((e) => e.eventType === "payment_method_selected")?.meta.method as string) ||
        null;

      const base = {
        id: attemptId,
        sessionId,
        creator: anchor.creator ?? "unknown",
        plan,
        device: resolveDevice(slice, sessionEvents),
        startedAt: anchor.createdAt,
        hasPlanSelectedBefore,
        hasCheckoutClicked:
          eventBeforeAnchor(parsed, anchor, "checkout_clicked", PLAN_TO_CHECKOUT_MAX_MS) ||
          slice.some((e) => e.eventType === "checkout_clicked"),
        hasCheckoutLoaded: true,
        hasPaymentElementLoaded: slice.some((e) => e.eventType === "payment_element_loaded"),
        hasPaymentMethodAvailable: slice.some((e) => e.eventType === "payment_method_available"),
        hasPaymentStarted,
        hasPurchaseCompleted,
        hasPaymentFailed: slice.some((e) => e.eventType === "payment_failed"),
        hasPaymentCancelled: slice.some((e) => e.eventType === "payment_cancelled"),
        hasCheckoutAbandoned: slice.some((e) => e.eventType === "checkout_abandoned"),
        paymentMethod,
      };

      attempts.push({
        ...base,
        abandonmentStage: classifyAbandonment(base),
      });
    }
  }

  // Attach server-side purchase_completed events (often use server_* sessionIds)
  const purchases = parsed.filter((e) => isPurchaseType(e.eventType));
  let unlinkedPurchases = 0;
  for (const p of purchases) {
    const planId = normalizePlan(p.meta, null);
    const pTime = p.createdAt.getTime();
    const creator = p.creator ?? "unknown";

    const match = attempts.find(
      (a) =>
        !a.hasPurchaseCompleted &&
        a.hasCheckoutLoaded &&
        a.creator === creator &&
        a.plan === planId &&
        pTime >= a.startedAt.getTime() &&
        pTime <= a.startedAt.getTime() + ATTEMPT_WINDOW_MS
    );

    if (match) {
      match.hasPurchaseCompleted = true;
      match.abandonmentStage = null;
    } else {
      unlinkedPurchases++;
    }
  }

  for (const attempt of attempts) {
    attempt.abandonmentStage = classifyAbandonment(attempt);
  }

  return { attempts, unlinkedPurchases };
}

function countAttemptsWhere(attempts: CheckoutAttempt[], pred: (a: CheckoutAttempt) => boolean): number {
  return attempts.filter(pred).length;
}

export type CheckoutAnalyticsData = {
  reportingStart: Date;
  schemaVersion: string;
  excludedLegacyEvents: number;
  includedEvents: number;
  unlinkedPurchases: number;
  attempts: CheckoutAttempt[];
  funnel: {
    planSelectedSessions: number;
    checkoutClicked: number;
    checkoutLoaded: number;
    paymentElementLoaded: number;
    paymentMethodAvailable: number;
    paymentStarted: number;
    purchaseCompleted: number;
    paymentFailed: number;
    paymentCancelled: number;
    abandoned: number;
  };
  sequentialFunnel: {
    planToLoaded: { num: number; den: number };
    loadedToElement: { num: number; den: number };
    elementToStarted: { num: number; den: number };
    startedToPurchase: { num: number; den: number };
    loadedToPurchase: { num: number; den: number };
  };
  breakdownByPlan: Array<{
    plan: string;
    loaded: number;
    started: number;
    purchased: number;
    abandoned: number;
    cvr: number;
  }>;
  breakdownBySource: Array<{
    source: string;
    loaded: number;
    started: number;
    purchased: number;
    abandoned: number;
    cvr: number;
  }>;
  breakdownByDevice: Array<{
    device: string;
    loaded: number;
    started: number;
    purchased: number;
    cvr: number;
  }>;
  methodAvailability: {
    applePayAttempts: number;
    googlePayAttempts: number;
    cardOnlyAttempts: number;
    totalChecks: number;
  };
  methodByPayment: Record<string, { started: number; completed: number }>;
  abandonment: {
    byStage: Record<AbandonmentStage, number>;
    byPlan: Record<string, number>;
    byDevice: Record<string, number>;
    bySource: Record<string, number>;
  };
  rawCounts: Array<{ eventType: string; total: number; uniqueSessions: number }>;
  recentEvents: Array<{
    createdAt: Date;
    eventType: string;
    creator: string;
    plan: string;
    device: string;
  }>;
};

export async function getCheckoutAnalyticsData(): Promise<CheckoutAnalyticsData> {
  const allEvents = await prisma.influencerEvent.findMany({
    where: { eventType: { in: [...CHECKOUT_EVENT_TYPES] } },
    select: {
      id: true,
      eventType: true,
      creator: true,
      sessionId: true,
      visitorId: true,
      plan: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const excludedLegacyEvents = allEvents.filter((e) => {
    const meta = parseMeta(e.metadata);
    return !isPostSchemaEvent(e, meta);
  }).length;

  const included = allEvents.filter((e) => {
    const meta = parseMeta(e.metadata);
    return isPostSchemaEvent(e, meta);
  });

  const { attempts: allAttempts, unlinkedPurchases } = buildAttempts(included);
  const attempts = allAttempts.filter((a) => a.hasCheckoutLoaded);
  const loadedAttempts = attempts;

  const planSelectedSessions = new Set(
    included.filter((e) => e.eventType === "plan_selected" && e.visitorId).map((e) => e.visitorId)
  ).size;

  const funnel = {
    planSelectedSessions,
    checkoutClicked: countAttemptsWhere(attempts, (a) => a.hasCheckoutClicked),
    checkoutLoaded: countAttemptsWhere(attempts, (a) => a.hasCheckoutLoaded),
    paymentElementLoaded: countAttemptsWhere(attempts, (a) => a.hasPaymentElementLoaded),
    paymentMethodAvailable: countAttemptsWhere(attempts, (a) => a.hasPaymentMethodAvailable),
    paymentStarted: countAttemptsWhere(attempts, (a) => a.hasPaymentStarted),
    purchaseCompleted: countAttemptsWhere(attempts, (a) => a.hasPurchaseCompleted),
    paymentFailed: countAttemptsWhere(attempts, (a) => a.hasPaymentFailed),
    paymentCancelled: countAttemptsWhere(attempts, (a) => a.hasPaymentCancelled),
    abandoned: countAttemptsWhere(attempts, (a) => a.abandonmentStage !== null),
  };

  const loaded = funnel.checkoutLoaded;
  const withPlanBefore = countAttemptsWhere(attempts, (a) => a.hasCheckoutLoaded && a.hasPlanSelectedBefore);
  const withElement = countAttemptsWhere(
    attempts,
    (a) => a.hasCheckoutLoaded && a.hasPaymentElementLoaded
  );
  const withStarted = countAttemptsWhere(
    attempts,
    (a) => a.hasCheckoutLoaded && a.hasPaymentStarted
  );
  const withPurchase = countAttemptsWhere(
    attempts,
    (a) => a.hasCheckoutLoaded && a.hasPurchaseCompleted
  );

  const sequentialFunnel = {
    planToLoaded: { num: withPlanBefore, den: planSelectedSessions },
    loadedToElement: { num: withElement, den: loaded },
    elementToStarted: {
      num: withStarted,
      den: countAttemptsWhere(attempts, (a) => a.hasCheckoutLoaded && a.hasPaymentElementLoaded),
    },
    startedToPurchase: {
      num: withPurchase,
      den: countAttemptsWhere(attempts, (a) => a.hasCheckoutLoaded && a.hasPaymentStarted),
    },
    loadedToPurchase: { num: withPurchase, den: loaded },
  };

  function breakdown(
    keyFn: (a: CheckoutAttempt) => string
  ): Array<{ key: string; loaded: number; started: number; purchased: number; abandoned: number; cvr: number }> {
    const map = new Map<string, CheckoutAttempt[]>();
    for (const a of loadedAttempts) {
      const k = keyFn(a);
      const list = map.get(k) ?? [];
      list.push(a);
      map.set(k, list);
    }
    return [...map.entries()]
      .map(([key, list]) => {
        const l = list.length;
        const started = list.filter((a) => a.hasPaymentStarted).length;
        const purchased = list.filter((a) => a.hasPurchaseCompleted).length;
        const abandoned = list.filter((a) => a.abandonmentStage !== null).length;
        return {
          key,
          loaded: l,
          started,
          purchased,
          abandoned,
          cvr: l ? purchased / l : 0,
        };
      })
      .sort((a, b) => b.loaded - a.loaded);
  }

  const breakdownByPlan = breakdown((a) => a.plan).map((r) => ({
    plan: r.key,
    loaded: r.loaded,
    started: r.started,
    purchased: r.purchased,
    abandoned: r.abandoned,
    cvr: r.cvr,
  }));

  const breakdownBySource = breakdown((a) => a.creator).map((r) => ({
    source: r.key,
    loaded: r.loaded,
    started: r.started,
    purchased: r.purchased,
    abandoned: r.abandoned,
    cvr: r.cvr,
  }));

  const breakdownByDevice = breakdown((a) => a.device).map((r) => ({
    device: r.key,
    loaded: r.loaded,
    started: r.started,
    purchased: r.purchased,
    cvr: r.cvr,
  }));

  // Method availability — distinct attempts
  const availEvents = included.filter((e) => e.eventType === "payment_method_available");
  const availAttemptIds = new Set<string>();
  let applePayAttempts = 0;
  let googlePayAttempts = 0;
  let cardOnlyAttempts = 0;

  for (const a of attempts) {
    if (!a.hasPaymentMethodAvailable) continue;
    if (availAttemptIds.has(a.id)) continue;
    availAttemptIds.add(a.id);
    const ev = availEvents.find(
      (e) =>
        e.sessionId === a.sessionId &&
        e.createdAt.getTime() >= a.startedAt.getTime() &&
        e.createdAt.getTime() <= a.startedAt.getTime() + ATTEMPT_WINDOW_MS
    );
    if (!ev) continue;
    const meta = parseMeta(ev.metadata);
    if (meta.apple_pay_available) applePayAttempts++;
    if (meta.google_pay_available) googlePayAttempts++;
    if (!meta.apple_pay_available && !meta.google_pay_available) cardOnlyAttempts++;
  }

  const methodByPayment: Record<string, { started: number; completed: number }> = {};
  for (const a of attempts) {
    if (!a.hasPaymentStarted) continue;
    const method = a.paymentMethod || "card";
    if (!methodByPayment[method]) methodByPayment[method] = { started: 0, completed: 0 };
    methodByPayment[method].started++;
    if (a.hasPurchaseCompleted) methodByPayment[method].completed++;
  }

  const byStage: Record<AbandonmentStage, number> = {
    before_payment_element_loaded: 0,
    after_payment_element_loaded_before_payment_started: 0,
    after_payment_started: 0,
    payment_failed_not_recovered: 0,
    payment_cancelled: 0,
  };
  const byPlan: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const a of attempts) {
    if (!a.abandonmentStage) continue;
    byStage[a.abandonmentStage]++;
    byPlan[a.plan] = (byPlan[a.plan] ?? 0) + 1;
    byDevice[a.device] = (byDevice[a.device] ?? 0) + 1;
    bySource[a.creator] = (bySource[a.creator] ?? 0) + 1;
  }

  const sessionSets: Record<string, Set<string>> = {};
  for (const e of included) {
    if (!e.sessionId) continue;
    if (!sessionSets[e.eventType]) sessionSets[e.eventType] = new Set();
    sessionSets[e.eventType].add(e.sessionId);
  }

  const rawCounts = CHECKOUT_EVENT_TYPES.map((eventType) => ({
    eventType,
    total: included.filter((e) => e.eventType === eventType).length,
    uniqueSessions: sessionSets[eventType]?.size ?? 0,
  })).filter((r) => r.total > 0);

  const recentEvents = included.slice(0, 50).map((e) => {
    const meta = parseMeta(e.metadata);
    return {
      createdAt: e.createdAt,
      eventType: e.eventType,
      creator: e.creator ?? "unknown",
      plan: normalizePlan(meta, e.plan),
      device: deviceFromMeta(meta) ?? "—",
    };
  });

  return {
    reportingStart: CHECKOUT_ANALYTICS_REPORTING_START,
    schemaVersion: CHECKOUT_ANALYTICS_SCHEMA,
    excludedLegacyEvents: excludedLegacyEvents,
    includedEvents: included.length,
    unlinkedPurchases,
    attempts,
    funnel,
    sequentialFunnel,
    breakdownByPlan,
    breakdownBySource,
    breakdownByDevice,
    methodAvailability: {
      applePayAttempts,
      googlePayAttempts,
      cardOnlyAttempts,
      totalChecks: availAttemptIds.size,
    },
    methodByPayment,
    abandonment: { byStage, byPlan, byDevice, bySource },
    rawCounts,
    recentEvents,
  };
}

export function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}
