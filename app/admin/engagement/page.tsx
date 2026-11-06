import { getEngagementData, pct } from "@/lib/queries/engagement-events";
import { formatAdminDateTime } from "@/lib/admin-datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Engagement | Admin" };

function Funnel({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ label: string; value: number; pctOf?: number }>;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="font-semibold text-white mb-4">{title}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <div key={s.label} className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-zinc-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white leading-none">{s.value.toLocaleString()}</p>
            {i > 0 && (
              <p className="text-[10px] text-zinc-600 mt-0.5">{pct(s.value, steps[0].value)} of step 1</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: Array<{ date: string; count: number }> }) {
  if (points.length === 0) return <p className="text-xs text-zinc-500">No data yet in this window.</p>;
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {points.map((p) => (
        <div
          key={p.date}
          title={`${p.date}: ${p.count}`}
          className="flex-1 bg-gold/60 hover:bg-gold rounded-t-sm transition-colors min-w-[2px]"
          style={{ height: `${Math.max(4, (p.count / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function EventTable({ rows }: { rows: Array<{ eventType: string; total: number; sessions: number }> }) {
  const nonEmpty = rows.filter((r) => r.total > 0);
  const empty = rows.filter((r) => r.total === 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 text-[11px] uppercase tracking-wider">
            <th className="py-1.5 pr-4">Event</th>
            <th className="py-1.5 pr-4 text-right">Total</th>
            <th className="py-1.5 text-right">Unique sessions</th>
          </tr>
        </thead>
        <tbody>
          {nonEmpty.map((r) => (
            <tr key={r.eventType} className="border-t border-zinc-800/60">
              <td className="py-1.5 pr-4 font-mono text-xs text-zinc-300">{r.eventType}</td>
              <td className="py-1.5 pr-4 text-right text-white font-medium">{r.total.toLocaleString()}</td>
              <td className="py-1.5 text-right text-zinc-400">{r.sessions.toLocaleString()}</td>
            </tr>
          ))}
          {empty.length > 0 && (
            <tr className="border-t border-zinc-800/60">
              <td colSpan={3} className="py-1.5 text-xs text-zinc-600 font-mono">
                No events yet: {empty.map((r) => r.eventType).join(", ")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function EngagementPage() {
  const data = await getEngagementData();

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">In-App Engagement</h1>
        <p className="text-sm text-zinc-400">
          Post-purchase, in-app behavior inside /seerah, /student, and /billing — separate from the
          marketing/checkout funnel on{" "}
          <a href="/admin/funnel-events" className="text-amber-400 hover:underline">
            Funnel Events
          </a>
          . All counts are all-time unless noted; the two charts below are the last {data.lookbackDays} days.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total in-app events", value: data.totalEvents.toLocaleString() },
          { label: "Unique sessions", value: data.totalSessions.toLocaleString() },
          { label: "Distinct parts viewed", value: data.totalUniqueParts.toLocaleString() },
        ].map((c) => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Funnels */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Engagement funnels (distinct sessions, all-time)
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Funnel
            title="Video completion"
            steps={[
              { label: "Started", value: data.videoFunnel.started },
              { label: "Completed", value: data.videoFunnel.completed },
            ]}
          />
          <Funnel
            title="Reading completion"
            steps={[
              { label: "Started", value: data.readFunnel.started },
              { label: "Completed", value: data.readFunnel.completed },
            ]}
          />
          <Funnel
            title="Lesson quiz completion"
            steps={[
              { label: "Started", value: data.quizFunnel.started },
              { label: "Completed", value: data.quizFunnel.completed },
            ]}
          />
          <Funnel
            title="Welcome tour"
            steps={[
              { label: "Started", value: data.welcomeTourFunnel.started },
              { label: "Completed", value: data.welcomeTourFunnel.completed },
              { label: "Skipped", value: data.welcomeTourFunnel.skipped },
            ]}
          />
        </div>
      </div>

      {/* Churn signal */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Cancellation flow (distinct sessions, all-time)
        </h2>
        <Funnel
          title="Subscription cancel flow"
          steps={[
            { label: "Initiated", value: data.cancelFunnel.initiated },
            { label: "Abandoned (kept plan)", value: data.cancelFunnel.abandoned },
            { label: "Cancelled", value: data.cancelFunnel.cancelled },
          ]}
        />
      </div>

      {/* Trends */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="font-semibold text-white mb-3">Lesson views — last {data.lookbackDays} days</p>
          <Sparkline points={data.dailyLessonViews} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="font-semibold text-white mb-3">Video starts — last {data.lookbackDays} days</p>
          <Sparkline points={data.dailyVideoStarts} />
        </div>
      </div>

      {/* Top parts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="font-semibold text-white mb-3">Most-viewed lesson parts (all-time)</p>
        {data.topParts.length === 0 ? (
          <p className="text-xs text-zinc-500">No lesson views recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {data.topParts.map((p) => (
              <div key={p.partNumber} className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-zinc-500 mb-1">Part {p.partNumber}</p>
                <p className="text-lg font-bold text-white leading-none">{p.views.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event tables by section */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Raw event counts by category
        </h2>
        {data.sections.map((section) => (
          <div key={section.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="font-semibold text-white mb-3">{section.title}</p>
            <EventTable rows={section.rows} />
          </div>
        ))}
      </div>

      {/* Recent raw events */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="font-semibold text-white mb-3">Most recent events (last 50)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500 uppercase tracking-wider">
                <th className="py-1.5 pr-4">Time</th>
                <th className="py-1.5 pr-4">Event</th>
                <th className="py-1.5 pr-4">Route</th>
                <th className="py-1.5">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((e) => (
                <tr key={e.id} className="border-t border-zinc-800/60 align-top">
                  <td className="py-1.5 pr-4 whitespace-nowrap text-zinc-400">{formatAdminDateTime(e.createdAt)}</td>
                  <td className="py-1.5 pr-4 font-mono text-zinc-300 whitespace-nowrap">{e.eventType}</td>
                  <td className="py-1.5 pr-4 text-zinc-500 whitespace-nowrap">{e.route ?? "—"}</td>
                  <td className="py-1.5 text-zinc-600 font-mono max-w-[480px] truncate" title={e.metadata ?? ""}>
                    {e.metadata ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
