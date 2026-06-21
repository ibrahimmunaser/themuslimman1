import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funnel Events | Admin" };

const CREATORS = ["homepage", "theorthodoxmuslim", "deenresponds", "browniesaadi"] as const;
const CREATOR_LABELS: Record<string, string> = {
  homepage:         "Homepage (/checkup)",
  theorthodoxmuslim: "The Orthodox Muslim",
  deenresponds:     "Deen Responds",
  browniesaadi:     "Brownie Saadi",
};

const QUIZ_FUNNEL_EVENTS = [
  "quiz_started",
  "quiz_completed",
  "quiz_email_submitted",
  "quiz_result_viewed",
  "quiz_recommended_cta_clicked",
  "quiz_abandoned",
] as const;

const CHECKOUT_EVENTS = [
  "checkout_loaded",
  "payment_started",
  "payment_submitted",
  "payment_succeeded",
  "payment_failed",
  "checkout_abandoned",
  "checkout_escape_clicked",
] as const;

export default async function FunnelEventsPage() {
  // ── Aggregate counts: event type × creator ──────────────────────────────
  const eventCounts = await prisma.influencerEvent.groupBy({
    by: ["creator", "eventType"],
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
  });

  // ── Unique visitor + session counts per creator ──────────────────────────
  const rawVisitors = await prisma.$queryRaw<{ creator: string; visitors: bigint; sessions: bigint }[]>`
    SELECT creator,
           COUNT(DISTINCT "visitorId") AS visitors,
           COUNT(DISTINCT "sessionId") AS sessions
    FROM "InfluencerEvent"
    GROUP BY creator
  `;

  const visitorMap: Record<string, { visitors: number; sessions: number }> = {};
  for (const r of rawVisitors) {
    visitorMap[r.creator] = { visitors: Number(r.visitors), sessions: Number(r.sessions) };
  }

  // ── Build per-creator lookup: eventType → count ─────────────────────────
  const byCreator: Record<string, Record<string, number>> = {};
  for (const row of eventCounts) {
    if (!byCreator[row.creator]) byCreator[row.creator] = {};
    byCreator[row.creator][row.eventType] = row._count._all;
  }

  // ── Checkup leads per source ─────────────────────────────────────────────
  const leadsBySource = await prisma.seerahCheckupLead.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const leadSourceMap: Record<string, number> = {};
  for (const r of leadsBySource) {
    leadSourceMap[r.source ?? "unknown"] = r._count._all;
  }

  // ── Total unique visitors across all creators ────────────────────────────
  const totalVisitorsRow = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COUNT(DISTINCT "visitorId") AS total FROM "InfluencerEvent"
  `;
  const totalVisitors = Number(totalVisitorsRow[0]?.total ?? 0);

  // ── Recent 50 events ─────────────────────────────────────────────────────
  const recentEvents = await prisma.influencerEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, creator: true, eventType: true, sessionId: true,
      route: true, plan: true, metadata: true, createdAt: true,
    },
  });

  // ── All-creator totals for summary bar ──────────────────────────────────
  const totalEvents = eventCounts.reduce((s, r) => s + r._count._all, 0);
  const totalLeads  = Object.values(leadSourceMap).reduce((s, v) => s + v, 0);

  function count(creator: string, event: string) {
    return byCreator[creator]?.[event] ?? 0;
  }
  function pct(num: number, den: number) {
    if (!den) return "—";
    return `${Math.round((num / den) * 100)}%`;
  }
  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Funnel Events</h1>
        <p className="text-sm text-zinc-400">All tracking events across every quiz funnel and checkout flow.</p>
      </div>

      {/* ── Top-level summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total events",     value: totalEvents.toLocaleString() },
          { label: "Unique visitors",  value: totalVisitors.toLocaleString() },
          { label: "Quiz leads (emails)", value: totalLeads.toLocaleString() },
          { label: "Active funnels",   value: CREATORS.length.toString() },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Per-creator quiz funnel ── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Quiz funnel by source</h2>
        <div className="grid gap-4">
          {CREATORS.map(creator => {
            const started  = count(creator, "quiz_started");
            const completed = count(creator, "quiz_completed");
            const emails   = count(creator, "quiz_email_submitted");
            const ctaClick = count(creator, "quiz_recommended_cta_clicked");
            const abandoned = count(creator, "quiz_abandoned");
            const checkoutLoaded = count(creator, "checkout_loaded");
            const paymentSucceeded = count(creator, "payment_succeeded");
            const leads    = leadSourceMap[creator] ?? 0;
            const visitors = visitorMap[creator]?.visitors ?? 0;

            return (
              <div key={creator} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-white">{CREATOR_LABELS[creator] ?? creator}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{visitors.toLocaleString()} unique visitors · {leads} emails captured</p>
                  </div>
                  <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-zinc-400">{creator}</span>
                </div>

                {/* Funnel steps */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { label: "Started",    value: started,          sub: pct(started, visitors) },
                    { label: "Completed",  value: completed,        sub: pct(completed, started) },
                    { label: "Email",      value: emails,           sub: pct(emails, completed) },
                    { label: "CTA Click",  value: ctaClick,         sub: pct(ctaClick, emails) },
                    { label: "Abandoned",  value: abandoned,        sub: pct(abandoned, started) },
                    { label: "Checkout",   value: checkoutLoaded,   sub: pct(checkoutLoaded, emails) },
                    { label: "Paid",       value: paymentSucceeded, sub: pct(paymentSucceeded, checkoutLoaded) },
                    { label: "Leads saved", value: leads,           sub: pct(leads, completed) },
                  ].map(s => (
                    <div key={s.label} className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-zinc-500 mb-1">{s.label}</p>
                      <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Checkout funnel breakdown ── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Checkout events by source</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2.5 text-left font-medium">Source</th>
                  {CHECKOUT_EVENTS.map(e => (
                    <th key={e} className="px-3 py-2.5 text-center font-medium whitespace-nowrap">{e.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CREATORS.map(creator => (
                  <tr key={creator} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-2.5 text-zinc-300 font-medium">{CREATOR_LABELS[creator] ?? creator}</td>
                    {CHECKOUT_EVENTS.map(e => (
                      <td key={e} className="px-3 py-2.5 text-center text-zinc-400">
                        {count(creator, e) || <span className="text-zinc-700">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── All event types raw counts ── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">All event types — total counts</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2.5 text-left font-medium">Event type</th>
                  <th className="px-3 py-2.5 text-center font-medium">Total</th>
                  {CREATORS.map(c => (
                    <th key={c} className="px-3 py-2.5 text-center font-medium">{CREATOR_LABELS[c] ?? c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventCounts
                  .filter((v, i, arr) => arr.findIndex(a => a.eventType === v.eventType) === i)
                  .sort((a, b) => {
                    const totalA = CREATORS.reduce((s, c) => s + (byCreator[c]?.[a.eventType] ?? 0), 0);
                    const totalB = CREATORS.reduce((s, c) => s + (byCreator[c]?.[b.eventType] ?? 0), 0);
                    return totalB - totalA;
                  })
                  .map(row => {
                    const total = CREATORS.reduce((s, c) => s + (byCreator[c]?.[row.eventType] ?? 0), 0);
                    return (
                      <tr key={row.eventType} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-4 py-2 text-zinc-300 font-mono">{row.eventType}</td>
                        <td className="px-3 py-2 text-center font-semibold text-white">{total}</td>
                        {CREATORS.map(c => (
                          <td key={c} className="px-3 py-2 text-center text-zinc-400">
                            {count(c, row.eventType) || <span className="text-zinc-700">—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Recent 50 events ── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Recent events</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                  <th className="px-3 py-2.5 text-left font-medium">Creator</th>
                  <th className="px-3 py-2.5 text-left font-medium">Event</th>
                  <th className="px-3 py-2.5 text-left font-medium">Route</th>
                  <th className="px-3 py-2.5 text-left font-medium">Plan</th>
                  <th className="px-3 py-2.5 text-left font-medium">Session</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map(ev => (
                  <tr key={ev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(ev.createdAt)}</td>
                    <td className="px-3 py-2 text-zinc-400">{ev.creator}</td>
                    <td className="px-3 py-2 font-mono text-zinc-300">{ev.eventType}</td>
                    <td className="px-3 py-2 text-zinc-600 max-w-[180px] truncate">{ev.route ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">{ev.plan ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-700 font-mono max-w-[100px] truncate">{ev.sessionId.slice(0, 10)}…</td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">No events yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
