import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FunnelStep {
  key: string;
  label: string;
}

interface FunnelEvent {
  id: string;
  eventType: string;
  sessionId: string;
  visitorId: string;
  plan: string | null;
  promoCode: string | null;
  amount: number | null;
  userEmail: string | null;
  metadata?: string | null;
  createdAt: Date;
}

interface Purchase {
  id: string;
  amount: number;
  createdAt: Date;
  userEmail: string;
  promoCode: string | null;
}

interface TrialSub {
  id: string;
  createdAt: Date;
  userEmail: string;
  promoCode: string | null;
}

interface BrownieStatsDashboardProps {
  displayName: string;
  rawClicks: number;
  events: FunnelEvent[];
  purchases: Purchase[];
  trials: TrialSub[];
  lastUpdated: Date;
  /**
   * Funnel step definitions in order. Defaults to the standard Brownie funnel.
   */
  funnelSteps?: FunnelStep[];
  /**
   * Event key whose unique sessions serve as the "100%" baseline for conversion
   * percentages. Defaults to "brownie_landing_page_view".
   */
  landingEventKey?: string;
  /**
   * Commission per sale in cents. Defaults to 500 ($5).
   * Pass 0 to hide the commission card and show a revenue card instead.
   */
  commissionPerSale?: number;
}

// ── Default funnel steps ───────────────────────────────────────────────────────

const DEFAULT_FUNNEL_STEPS: FunnelStep[] = [
  { key: "brownie_landing_page_view",           label: "Landing Views"                    },
  { key: "individual_lifetime_cta_clicked",     label: "Clicked Individual Lifetime CTA"  },
  { key: "family_lifetime_cta_clicked",         label: "Clicked Family Lifetime CTA"      },
  { key: "watch_part1_clicked",                 label: "Clicked Watch Part 1 Free"        },
  { key: "checkout_loaded_individual_lifetime", label: "Checkout — Individual Lifetime"   },
  { key: "checkout_loaded_family_lifetime",     label: "Checkout — Family Lifetime"       },
  { key: "change_plan_clicked",                 label: "Clicked Change Plan"              },
  { key: "checkout_form_submitted",             label: "Submitted Payment Form"           },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 3)}***@${domain}`;
}

function fmt(n: number) { return n.toLocaleString(); }

function fmtUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(d);
}

function fmtShortDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

// ── Main component ────────────────────────────────────────────────────────────

export function BrownieStatsDashboard({
  displayName,
  rawClicks,
  events,
  purchases,
  trials,
  lastUpdated,
  funnelSteps = DEFAULT_FUNNEL_STEPS,
  landingEventKey,
  commissionPerSale = 500,
}: BrownieStatsDashboardProps) {
  const uniqueVisitors = new Set(events.map((e) => e.visitorId)).size;
  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

  // Per-event-type counts and unique session sets
  const eventCountMap = new Map<string, number>();
  const eventSessionMap = new Map<string, Set<string>>();
  for (const e of events) {
    eventCountMap.set(e.eventType, (eventCountMap.get(e.eventType) ?? 0) + 1);
    const s = eventSessionMap.get(e.eventType) ?? new Set();
    s.add(e.sessionId);
    eventSessionMap.set(e.eventType, s);
  }

  // Resolve the landing baseline — try the explicit key first, then the first
  // funnel step, then fall back to all unique sessions.
  const resolvedLandingKey = landingEventKey ?? funnelSteps[0]?.key;
  const landingUniqueSessions =
    (resolvedLandingKey ? eventSessionMap.get(resolvedLandingKey)?.size : undefined)
    ?? uniqueSessions;

  const totalRevenueCents = purchases.reduce((sum, p) => sum + p.amount, 0);
  const commissionCents = commissionPerSale > 0 ? purchases.length * commissionPerSale : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="w-full max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div>
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2">
            Funnel Dashboard
          </p>
          <h1 className="text-3xl font-bold text-white">{displayName} Stats</h1>
          <p className="text-zinc-600 text-xs mt-1">Last updated: {fmtDate(lastUpdated)}</p>
        </div>

        {/* ── Commission or Revenue highlight ────────────────────── */}
        {commissionPerSale > 0 ? (
          <div className="border border-amber-500/30 rounded-xl p-5 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1">
              Your Commission
            </p>
            <p className="text-4xl font-bold text-amber-400">{fmtUsd(commissionCents)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {fmtUsd(commissionPerSale)} per sale · {purchases.length} sale{purchases.length !== 1 ? "s" : ""}
              {trials.length > 0 ? ` · ${trials.length} trial${trials.length !== 1 ? "s" : ""}` : ""}
            </p>
            {trials.length > 0 && (
              <p className="text-xs text-zinc-600 mt-0.5">
                Note: trials are not commissionable until they convert to paid.
              </p>
            )}
          </div>
        ) : (
          <div className="border border-amber-500/30 rounded-xl p-5 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1">
              Total Revenue
            </p>
            <p className="text-4xl font-bold text-amber-400">{fmtUsd(totalRevenueCents)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              from {purchases.length} sale{purchases.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ── Summary metrics ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Raw Page Loads"  value={fmt(rawClicks)}       note="Includes refreshes & bots" />
            <MetricCard label="Unique Visitors"  value={fmt(uniqueVisitors)}  note="From funnel events" />
            <MetricCard label="Unique Sessions"  value={fmt(uniqueSessions)}  note="From funnel events" />
            <MetricCard label="Paid Purchases"   value={fmt(purchases.length)} />
            {trials.length > 0 && (
              <MetricCard label="Trial Starts" value={fmt(trials.length)} />
            )}
            <MetricCard
              label="Revenue"
              value={fmtUsd(totalRevenueCents)}
              note="Gross, before fees"
            />
          </div>
        </div>

        {/* ── Funnel table ───────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Funnel</p>
          <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Step</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Events</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uniq Sessions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">vs Landing</th>
                </tr>
              </thead>
              <tbody>
                {funnelSteps.map(({ key, label }) => {
                  const count    = eventCountMap.get(key) ?? 0;
                  const sessions = eventSessionMap.get(key)?.size ?? 0;
                  const pct = landingUniqueSessions > 0
                    ? ((sessions / landingUniqueSessions) * 100).toFixed(1)
                    : "—";
                  return (
                    <tr key={key} className="border-b border-zinc-800/60 last:border-0 bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-300 text-sm">{label}</td>
                      <td className="px-4 py-3 text-right text-zinc-400 text-sm">{fmt(count)}</td>
                      <td className="px-4 py-3 text-right text-white font-semibold text-sm">{fmt(sessions)}</td>
                      <td className="px-4 py-3 text-right text-amber-400 text-sm">{pct === "—" ? "—" : `${pct}%`}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-zinc-700 bg-zinc-900/30">
                  <td className="px-4 py-3 text-zinc-300 font-semibold text-sm">Paid Purchases</td>
                  <td className="px-4 py-3 text-right text-zinc-400 text-sm">{fmt(purchases.length)}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold text-sm">{fmt(purchases.length)}</td>
                  <td className="px-4 py-3 text-right text-green-400 text-sm">
                    {landingUniqueSessions > 0
                      ? `${((purchases.length / landingUniqueSessions) * 100).toFixed(2)}%`
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Note: &ldquo;Raw Page Loads&rdquo; ({fmt(rawClicks)}) ≠ unique visitors. Use Unique Sessions above for accurate conversion rates.
          </p>
        </div>

        {/* ── Quiz funnel drop-off ───────────────────────────────── */}
        <QuizFunnelSection events={events} />

        {/* ── Purchase history ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Purchase History</p>
          {purchases.length === 0 ? (
            <EmptyState label="No purchases yet." sub="Sales will appear here." />
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Code</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                    {commissionPerSale > 0 && (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Your Cut</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-zinc-300 text-xs whitespace-nowrap">{fmtShortDate(new Date(p.createdAt))}</td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{maskEmail(p.userEmail)}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{p.promoCode ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-zinc-300 text-xs">{fmtUsd(p.amount)}</td>
                      {commissionPerSale > 0 && (
                        <td className="px-4 py-3 text-right text-amber-400 font-semibold text-xs">{fmtUsd(commissionPerSale)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Trial history ──────────────────────────────────────── */}
        {trials.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Trial Starts</p>
            <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t, i) => (
                    <tr key={t.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-zinc-300 text-xs whitespace-nowrap">{fmtShortDate(new Date(t.createdAt))}</td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{maskEmail(t.userEmail)}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{t.promoCode ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Event history ──────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Recent Event History <span className="text-zinc-700 normal-case">(last 100)</span>
          </p>
          {events.length === 0 ? (
            <EmptyState label="No events yet." sub="Funnel events will appear here once the tracker fires." />
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Session</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 100).map((e) => (
                    <tr key={e.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{fmtShortDate(new Date(e.createdAt))}</td>
                      <td className="px-4 py-3 text-amber-400 text-xs font-mono">{e.eventType}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{e.plan ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600 text-xs font-mono">{e.sessionId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{e.userEmail ? maskEmail(e.userEmail) : "—"}</td>
                      <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                        {e.amount != null ? fmtUsd(e.amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Quiz Funnel Section ────────────────────────────────────────────────────────

const QUIZ_QUESTION_COUNT = 10;

function parseMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

function QuizFunnelSection({ events }: { events: FunnelEvent[] }) {
  const quizEvents = events.filter((e) =>
    e.eventType === "quiz_started"              ||
    e.eventType === "quiz_question_viewed"      ||
    e.eventType === "quiz_question_answered"    ||
    e.eventType === "quiz_completed"            ||
    e.eventType === "quiz_email_reveal_viewed"  ||
    e.eventType === "quiz_email_submitted"      ||
    e.eventType === "quiz_result_viewed"        ||
    e.eventType === "quiz_recommended_cta_clicked" ||
    e.eventType === "quiz_abandoned"
  );

  if (quizEvents.length === 0) {
    return (
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Quiz Funnel Drop-off
        </p>
        <EmptyState
          label="No quiz funnel events yet."
          sub="Events will appear after users start the Seerah Checkup."
        />
      </div>
    );
  }

  // Unique sessions per event type
  const sessionsByType = new Map<string, Set<string>>();
  for (const e of quizEvents) {
    const s = sessionsByType.get(e.eventType) ?? new Set<string>();
    s.add(e.sessionId);
    sessionsByType.set(e.eventType, s);
  }
  const uniq = (key: string) => sessionsByType.get(key)?.size ?? 0;

  // Per-question unique session sets (from question_number in metadata)
  const qViewedSessions   = new Map<number, Set<string>>();
  const qAnsweredSessions = new Map<number, Set<string>>();
  for (const e of quizEvents) {
    const meta = parseMeta(e.metadata);
    const qn   = typeof meta.question_number === "number" ? meta.question_number : null;
    if (qn === null) continue;
    if (e.eventType === "quiz_question_viewed") {
      const s = qViewedSessions.get(qn) ?? new Set<string>();
      s.add(e.sessionId);
      qViewedSessions.set(qn, s);
    } else if (e.eventType === "quiz_question_answered") {
      const s = qAnsweredSessions.get(qn) ?? new Set<string>();
      s.add(e.sessionId);
      qAnsweredSessions.set(qn, s);
    }
  }

  const starts        = uniq("quiz_started");
  const completions   = uniq("quiz_completed");
  const emailViews    = uniq("quiz_email_reveal_viewed");
  const emailSubmits  = uniq("quiz_email_submitted");
  const resultViews   = uniq("quiz_result_viewed");
  const ctaClicks     = uniq("quiz_recommended_cta_clicked");
  const abandonments  = uniq("quiz_abandoned");
  const pct = (n: number) =>
    starts > 0 ? `${((n / starts) * 100).toFixed(1)}%` : "—";

  // Average answered count before abandonment
  let totalAnsweredOnAbandon = 0;
  let abandonCount = 0;
  for (const e of quizEvents) {
    if (e.eventType !== "quiz_abandoned") continue;
    const m = parseMeta(e.metadata);
    const c = typeof m.answered_count === "number" ? m.answered_count : 0;
    totalAnsweredOnAbandon += c;
    abandonCount++;
  }
  const avgAnsweredOnAbandon =
    abandonCount > 0 ? (totalAnsweredOnAbandon / abandonCount).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Quiz Funnel Drop-off
      </p>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Quiz Starts"      value={fmt(starts)}      note="Clicked Start" />
        <MetricCard label="Completions"      value={fmt(completions)} note={`${pct(completions)} of starts`} />
        <MetricCard label="Abandons"         value={fmt(abandonments)} note={`Avg ${avgAnsweredOnAbandon} Qs answered`} />
        <MetricCard label="CTA Clicks"       value={fmt(ctaClicks)}   note={`${pct(ctaClicks)} of starts`} />
      </div>

      {/* Drop-off table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stage</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uniq Sessions</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">vs Quiz Start</th>
            </tr>
          </thead>
          <tbody>
            <DropRow label="Quiz started"              sessions={starts}       baseline={starts} separator />
            {Array.from({ length: QUIZ_QUESTION_COUNT }, (_, i) => {
              const n = i + 1;
              const vSessions = qViewedSessions.get(n)?.size   ?? 0;
              const aSessions = qAnsweredSessions.get(n)?.size ?? 0;
              return (
                <React.Fragment key={n}>
                  <DropRow label={`Q${n} viewed`}   sessions={vSessions} baseline={starts} />
                  <DropRow label={`Q${n} answered`}  sessions={aSessions} baseline={starts} />
                </React.Fragment>
              );
            })}
            <DropRow label="Email reveal viewed"       sessions={emailViews}   baseline={starts} separator />
            <DropRow label="Email submitted"           sessions={emailSubmits} baseline={starts} />
            <DropRow label="Result viewed"             sessions={resultViews}  baseline={starts} />
            <DropRow label="Paid CTA clicked"          sessions={ctaClicks}    baseline={starts} />
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">
        All counts are unique sessions per stage. Requires quiz funnel events to be firing (new as of the quiz analytics update).
      </p>
    </div>
  );
}

function DropRow({
  label,
  sessions,
  baseline,
  separator = false,
}: {
  label: string;
  sessions: number;
  baseline: number;
  separator?: boolean;
}) {
  const pct = baseline > 0 ? ((sessions / baseline) * 100).toFixed(1) : "—";
  return (
    <tr
      className={`border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/50 transition-colors ${separator ? "border-t-2 border-zinc-700" : ""}`}
    >
      <td className="px-4 py-2.5 text-zinc-300 text-xs">{label}</td>
      <td className="px-4 py-2.5 text-right text-white font-semibold text-xs">{fmt(sessions)}</td>
      <td className="px-4 py-2.5 text-right text-amber-400 text-xs">
        {pct === "—" ? "—" : `${pct}%`}
      </td>
    </tr>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-zinc-800 rounded-xl px-4 py-4 bg-zinc-900/40">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {note && <p className="text-xs text-zinc-600 mt-0.5">{note}</p>}
    </div>
  );
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border border-zinc-800 rounded-xl px-5 py-10 bg-zinc-900/40 text-center">
      <p className="text-zinc-600 text-sm">{label}</p>
      <p className="text-zinc-700 text-xs mt-1">{sub}</p>
    </div>
  );
}
