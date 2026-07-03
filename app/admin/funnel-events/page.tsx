import {
  getFunnelEventsData,
  pct,
  CREATOR_LABELS,
  FUNNEL_CREATORS,
  CHECKOUT_RAW_EVENTS,
} from "@/lib/queries/funnel-events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funnel Events | Admin" };

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FunnelEventsPage() {
  const data = await getFunnelEventsData();

  const reportingLabel = data.checkoutReportingStart.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Funnel Events</h1>
        <p className="text-sm text-zinc-400">
          Quiz funnels use distinct visitors/sessions. Checkout tables below separate raw events from attempt-based v3 metrics.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total events (raw)", value: data.totalEvents.toLocaleString() },
          { label: "Unique visitors", value: data.totalVisitors.toLocaleString() },
          { label: "Quiz leads (emails)", value: data.totalLeads.toLocaleString() },
          { label: "Active funnels", value: FUNNEL_CREATORS.length.toString() },
        ].map((c) => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Definitions */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-1">
        <p className="font-semibold text-zinc-300 mb-2">Metric definitions</p>
        <p>
          <strong className="text-zinc-300">Quiz steps</strong> — distinct <code>visitorId</code> per event type (all-time).
        </p>
        <p>
          <strong className="text-zinc-300">Checkout</strong> — distinct <code>sessionId</code> with <code>checkout_loaded</code> (all-time).
        </p>
        <p>
          <strong className="text-zinc-300">Paid</strong> — distinct <code>sessionId</code> with server <code>purchase_completed</code> (all-time).
        </p>
        <p>
          <strong className="text-zinc-300">v3 attempts / purchases</strong> — attempt-based metrics since {reportingLabel}; see{" "}
          <a href="/admin/checkout-analytics" className="text-amber-400 hover:underline">
            Checkout Analytics
          </a>
          .
        </p>
        <p>
          <strong className="text-zinc-300">Raw tables</strong> — total event rows; do not use for conversion rates.
        </p>
      </section>

      {/* Quiz funnel by source */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Quiz funnel by source (distinct visitors / sessions)
        </h2>
        <div className="grid gap-4">
          {data.quizFunnels.map((row) => (
            <div key={row.creator} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-white">{CREATOR_LABELS[row.creator] ?? row.creator}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {row.visitors.toLocaleString()} unique visitors · {row.leads} emails captured
                  </p>
                </div>
                <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-zinc-400">
                  {row.creator}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
                {[
                  { label: "Started", value: row.started, sub: pct(row.started, row.visitors) },
                  { label: "Completed", value: row.completed, sub: pct(row.completed, row.started) },
                  { label: "Email", value: row.emails, sub: pct(row.emails, row.completed) },
                  { label: "CTA Click", value: row.ctaClick, sub: pct(row.ctaClick, row.emails) },
                  { label: "Abandoned", value: row.abandoned, sub: pct(row.abandoned, row.started) },
                  {
                    label: "Checkout",
                    value: row.checkoutSessions,
                    sub: pct(row.checkoutSessions, row.visitors),
                  },
                  {
                    label: "Paid (server)",
                    value: row.purchases,
                    sub: pct(row.purchases, row.checkoutSessions),
                  },
                  { label: "Leads saved", value: row.leads, sub: pct(row.leads, row.completed) },
                  {
                    label: "v3 Purchased",
                    value: row.v3Purchases,
                    sub: pct(row.v3Purchases, row.v3CheckoutAttempts),
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout raw events */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-1">
          Checkout events by source
        </h2>
        <p className="text-xs text-zinc-600 mb-3">Raw event counts (all-time) — diagnostic only.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2.5 text-left font-medium">Source</th>
                  {CHECKOUT_RAW_EVENTS.map((e) => (
                    <th key={e} className="px-3 py-2.5 text-center font-medium whitespace-nowrap">
                      {e.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNNEL_CREATORS.map((creator) => (
                  <tr key={creator} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-2.5 text-zinc-300 font-medium">
                      {CREATOR_LABELS[creator] ?? creator}
                    </td>
                    {CHECKOUT_RAW_EVENTS.map((e) => {
                      const n = data.checkoutRawByCreator[creator]?.[e] ?? 0;
                      return (
                        <td key={e} className="px-3 py-2.5 text-center text-zinc-400">
                          {n || <span className="text-zinc-700">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All event types raw */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-1">
          All event types — raw counts
        </h2>
        <p className="text-xs text-zinc-600 mb-3">Total event rows fired, not unique visitors.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-2.5 text-left font-medium">Event type</th>
                  <th className="px-3 py-2.5 text-center font-medium">Total</th>
                  {FUNNEL_CREATORS.map((c) => (
                    <th key={c} className="px-3 py-2.5 text-center font-medium">
                      {CREATOR_LABELS[c] ?? c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rawEventTypes.map((row) => (
                  <tr key={row.eventType} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-300 font-mono">{row.eventType}</td>
                    <td className="px-3 py-2 text-center font-semibold text-white">{row.total}</td>
                    {FUNNEL_CREATORS.map((c) => (
                      <td key={c} className="px-3 py-2 text-center text-zinc-400">
                        {row.byCreator[c] || <span className="text-zinc-700">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent events */}
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
                {data.recentEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(ev.createdAt)}</td>
                    <td className="px-3 py-2 text-zinc-400">{ev.creator}</td>
                    <td className="px-3 py-2 font-mono text-zinc-300">{ev.eventType}</td>
                    <td className="px-3 py-2 text-zinc-600 max-w-[180px] truncate">{ev.route ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">{ev.plan ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-700 font-mono max-w-[100px] truncate">
                      {ev.sessionId.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
                {data.recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                      No events yet.
                    </td>
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
