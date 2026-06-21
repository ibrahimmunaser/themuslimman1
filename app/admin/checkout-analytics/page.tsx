import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout Analytics | Admin" };

// ── Constants ──────────────────────────────────────────────────────────────────

const CHECKOUT_FUNNEL_EVENTS = [
  "plan_selected",
  "checkout_loaded",
  "payment_method_available",
  "payment_method_selected",
  "payment_started",
  "payment_submitted",
  "payment_succeeded",
  "payment_failed",
  "checkout_abandoned",
  "checkout_escape_clicked",
  "checkout_field_interacted",
] as const;

const PLAN_LABELS: Record<string, string> = {
  "individual-monthly":  "Individual Monthly ($4.99/mo)",
  "individual-lifetime": "Individual Lifetime ($49)",
  "family-monthly":      "Family Monthly ($9.99/mo)",
  "family-lifetime":     "Family Lifetime ($99)",
  "individual-trial":    "Individual Trial",
};

const SOURCE_LABELS: Record<string, string> = {
  homepage:          "Homepage",
  theorthodoxmuslim: "The Orthodox Muslim",
  deenresponds:      "Deen Responds",
  browniesaadi:      "Brownie Saadi",
  community:         "Community",
  annarbor:          "Ann Arbor",
  dearborn:          "Dearborn",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

function parseMeta(raw: string | null): Record<string, unknown> {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CheckoutAnalyticsPage() {
  // ── 1. All checkout-related events ────────────────────────────────────────
  const events = await prisma.influencerEvent.findMany({
    where: { eventType: { in: [...CHECKOUT_FUNNEL_EVENTS] } },
    select: { eventType: true, creator: true, sessionId: true, metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // ── 2. Aggregate event counts ──────────────────────────────────────────────
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.eventType] = (counts[e.eventType] ?? 0) + 1;
  }

  // ── 3. Unique sessions per event (dedupe) ──────────────────────────────────
  const sessionSets: Record<string, Set<string>> = {};
  for (const e of events) {
    if (!e.sessionId) continue;
    if (!sessionSets[e.eventType]) sessionSets[e.eventType] = new Set();
    sessionSets[e.eventType].add(e.sessionId);
  }
  const uniqueSessions = (key: string) => sessionSets[key]?.size ?? 0;

  // ── 4. Breakdown by plan ───────────────────────────────────────────────────
  const planEvents: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const meta = parseMeta(e.metadata);
    const plan = (meta.plan as string) || (meta.selected_plan as string) || "unknown";
    const normalized = plan.replace(/^(individual|family)-(monthly|lifetime|trial)$/, "$1-$2") || plan;
    if (!planEvents[normalized]) planEvents[normalized] = {};
    planEvents[normalized][e.eventType] = (planEvents[normalized][e.eventType] ?? 0) + 1;
  }

  // ── 5. Breakdown by source/influencer ─────────────────────────────────────
  const sourceEvents: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const src = e.creator ?? "unknown";
    if (!sourceEvents[src]) sourceEvents[src] = {};
    sourceEvents[src][e.eventType] = (sourceEvents[src][e.eventType] ?? 0) + 1;
  }

  // ── 6. Breakdown by device ─────────────────────────────────────────────────
  const deviceEvents: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const meta   = parseMeta(e.metadata);
    const device = (meta.device_type as string) || "unknown";
    if (!deviceEvents[device]) deviceEvents[device] = {};
    deviceEvents[device][e.eventType] = (deviceEvents[device][e.eventType] ?? 0) + 1;
  }

  // ── 7. Payment method availability ────────────────────────────────────────
  const methodAvailEvents = events.filter(e => e.eventType === "payment_method_available");
  let applePayCount    = 0;
  let googlePayCount   = 0;
  let cardOnlyCount    = 0;
  const methodPurchaseMap: Record<string, { started: number; completed: number }> = {};

  for (const e of methodAvailEvents) {
    const meta = parseMeta(e.metadata);
    if (meta.apple_pay_available)  applePayCount++;
    if (meta.google_pay_available) googlePayCount++;
    if (!meta.apple_pay_available && !meta.google_pay_available) cardOnlyCount++;
  }

  // Payment method selected → track which method was used for payment_started
  for (const e of events.filter(ev => ev.eventType === "payment_started")) {
    const meta   = parseMeta(e.metadata);
    const method = (meta.payment_method as string) || "card";
    if (!methodPurchaseMap[method]) methodPurchaseMap[method] = { started: 0, completed: 0 };
    methodPurchaseMap[method].started++;
  }
  for (const e of events.filter(ev => ev.eventType === "payment_succeeded")) {
    const meta   = parseMeta(e.metadata);
    const method = (meta.payment_method as string) || "card";
    if (!methodPurchaseMap[method]) methodPurchaseMap[method] = { started: 0, completed: 0 };
    methodPurchaseMap[method].completed++;
  }

  // ── 8. Abandonment breakdown ───────────────────────────────────────────────
  const abandonEvents = events.filter(e => e.eventType === "checkout_abandoned");
  let abandonBeforeMethod = 0;
  let abandonAfterMethod  = 0;
  let abandonAfterPayment = 0;

  const abandonByPlan:   Record<string, number> = {};
  const abandonByDevice: Record<string, number> = {};
  const abandonBySource: Record<string, number> = {};

  for (const e of abandonEvents) {
    const meta      = parseMeta(e.metadata);
    const hasMethod = !!(meta.payment_method_selected);
    const hasStarted= meta.payment_started === true;
    const plan      = (meta.plan as string) || (meta.selected_plan as string) || "unknown";
    const device    = (meta.device_type as string) || "unknown";
    const src       = e.creator ?? "unknown";

    if (hasStarted)       abandonAfterPayment++;
    else if (hasMethod)   abandonAfterMethod++;
    else                  abandonBeforeMethod++;

    abandonByPlan[plan]     = (abandonByPlan[plan] ?? 0) + 1;
    abandonByDevice[device] = (abandonByDevice[device] ?? 0) + 1;
    abandonBySource[src]    = (abandonBySource[src] ?? 0) + 1;
  }

  // ── 9. Totals for conversion rates ────────────────────────────────────────
  const loaded   = uniqueSessions("checkout_loaded");
  const started  = uniqueSessions("payment_started");
  const succeeded= uniqueSessions("payment_succeeded");
  const selected = uniqueSessions("plan_selected");

  // ── Recent events ─────────────────────────────────────────────────────────
  const recentEvents = events.slice(0, 50);

  // ── Render ──────────────────────────────────────────────────────────────────

  const cell = "px-3 py-2 text-sm text-zinc-300";
  const th   = "px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-left";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Checkout Analytics</h1>
        <p className="text-sm text-zinc-500">Full funnel from plan selection → checkout → payment.</p>
      </div>

      {/* ── Funnel Overview ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Funnel Overview (unique sessions)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Plan Selected",      val: uniqueSessions("plan_selected"),           color: "zinc"  as const },
            { label: "Checkout Loaded",    val: uniqueSessions("checkout_loaded"),          color: "blue"  as const },
            { label: "Method Available",   val: methodAvailEvents.length,                   color: "zinc"  as const },
            { label: "Method Selected",    val: uniqueSessions("payment_method_selected"),  color: "zinc"  as const },
            { label: "Payment Started",    val: uniqueSessions("payment_started"),          color: "gold"  as const },
            { label: "Payment Succeeded",  val: uniqueSessions("payment_succeeded"),        color: "green" as const },
            { label: "Payment Failed",     val: uniqueSessions("payment_failed"),           color: "red"   as const },
            { label: "Checkout Abandoned", val: uniqueSessions("checkout_abandoned"),       color: "red"   as const },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color === "green" ? "text-green-400" : color === "red" ? "text-red-400" : color === "gold" ? "text-amber-400" : color === "blue" ? "text-blue-400" : "text-white"}`}>{val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Conversion Rates ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Conversion Rates</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Funnel Step</th>
                <th className={`${th} text-right`}>Sessions</th>
                <th className={`${th} text-right`}>Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[
                { label: "Selected plan → Checkout loaded",      num: loaded,    den: selected,   n: loaded    },
                { label: "Checkout loaded → Payment started",    num: started,   den: loaded,     n: started   },
                { label: "Payment started → Purchase completed", num: succeeded, den: started,    n: succeeded },
                { label: "Checkout loaded → Purchase completed", num: succeeded, den: loaded,     n: succeeded },
              ].map(row => (
                <tr key={row.label}>
                  <td className={cell}>{row.label}</td>
                  <td className={`${cell} text-right font-mono`}>{row.n}</td>
                  <td className={`${cell} text-right`}>
                    <span className={`font-semibold ${row.num / (row.den || 1) > 0.5 ? "text-green-400" : row.num / (row.den || 1) > 0.2 ? "text-amber-400" : "text-red-400"}`}>
                      {pct(row.num, row.den)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Breakdown by Plan ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Plan</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Plan</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Succeeded</th>
                <th className={`${th} text-right`}>Abandoned</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {Object.entries(planEvents)
                .sort((a, b) => (b[1]["checkout_loaded"] ?? 0) - (a[1]["checkout_loaded"] ?? 0))
                .map(([plan, ev]) => {
                  const l = ev["checkout_loaded"] ?? 0;
                  const s = ev["payment_succeeded"] ?? 0;
                  return (
                    <tr key={plan}>
                      <td className={cell}>{PLAN_LABELS[plan] ?? plan}</td>
                      <td className={`${cell} text-right font-mono`}>{l}</td>
                      <td className={`${cell} text-right font-mono`}>{ev["payment_started"] ?? 0}</td>
                      <td className={`${cell} text-right font-mono text-green-400`}>{s}</td>
                      <td className={`${cell} text-right font-mono text-red-400`}>{ev["checkout_abandoned"] ?? 0}</td>
                      <td className={`${cell} text-right`}>
                        <span className={`font-semibold text-xs ${s / (l || 1) > 0.3 ? "text-green-400" : s / (l || 1) > 0.1 ? "text-amber-400" : "text-red-400"}`}>
                          {pct(s, l)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Breakdown by Source ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Source / Influencer</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Source</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Succeeded</th>
                <th className={`${th} text-right`}>Abandoned</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {Object.entries(sourceEvents)
                .sort((a, b) => (b[1]["checkout_loaded"] ?? 0) - (a[1]["checkout_loaded"] ?? 0))
                .map(([src, ev]) => {
                  const l = ev["checkout_loaded"] ?? 0;
                  const s = ev["payment_succeeded"] ?? 0;
                  return (
                    <tr key={src}>
                      <td className={cell}>{SOURCE_LABELS[src] ?? src}</td>
                      <td className={`${cell} text-right font-mono`}>{l}</td>
                      <td className={`${cell} text-right font-mono`}>{ev["payment_started"] ?? 0}</td>
                      <td className={`${cell} text-right font-mono text-green-400`}>{s}</td>
                      <td className={`${cell} text-right font-mono text-red-400`}>{ev["checkout_abandoned"] ?? 0}</td>
                      <td className={`${cell} text-right`}>
                        <span className={`font-semibold text-xs ${s / (l || 1) > 0.3 ? "text-green-400" : s / (l || 1) > 0.1 ? "text-amber-400" : "text-red-400"}`}>
                          {pct(s, l)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Breakdown by Device ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Device</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Device</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Succeeded</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {Object.entries(deviceEvents)
                .sort((a, b) => (b[1]["checkout_loaded"] ?? 0) - (a[1]["checkout_loaded"] ?? 0))
                .map(([device, ev]) => {
                  const l = ev["checkout_loaded"] ?? 0;
                  const s = ev["payment_succeeded"] ?? 0;
                  return (
                    <tr key={device}>
                      <td className={`${cell} capitalize`}>{device}</td>
                      <td className={`${cell} text-right font-mono`}>{l}</td>
                      <td className={`${cell} text-right font-mono`}>{ev["payment_started"] ?? 0}</td>
                      <td className={`${cell} text-right font-mono text-green-400`}>{s}</td>
                      <td className={`${cell} text-right`}>
                        <span className={`font-semibold text-xs ${s / (l || 1) > 0.3 ? "text-green-400" : s / (l || 1) > 0.1 ? "text-amber-400" : "text-red-400"}`}>
                          {pct(s, l)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Payment Method Visibility ─────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Payment Method Availability</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Apple Pay Available",  val: applePayCount,   total: methodAvailEvents.length, color: "green" as const },
            { label: "Google Pay Available", val: googlePayCount,  total: methodAvailEvents.length, color: "blue"  as const },
            { label: "Card Only",            val: cardOnlyCount,   total: methodAvailEvents.length, color: "zinc"  as const },
            { label: "Total Method Checks",  val: methodAvailEvents.length, total: methodAvailEvents.length, color: "zinc" as const },
          ].map(({ label, val, total, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color === "green" ? "text-green-400" : color === "blue" ? "text-blue-400" : "text-white"}`}>{val}</p>
              {total > 0 && <p className="text-xs text-zinc-600 mt-0.5">{pct(val, total)} of checkouts</p>}
            </div>
          ))}
        </div>

        {Object.keys(methodPurchaseMap).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className={th}>Payment Method</th>
                  <th className={`${th} text-right`}>Payment Started</th>
                  <th className={`${th} text-right`}>Completed</th>
                  <th className={`${th} text-right`}>Purchase Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {Object.entries(methodPurchaseMap)
                  .sort((a, b) => b[1].started - a[1].started)
                  .map(([method, data]) => (
                    <tr key={method}>
                      <td className={`${cell} capitalize`}>{method.replace("applePay", "Apple Pay").replace("googlePay", "Google Pay")}</td>
                      <td className={`${cell} text-right font-mono`}>{data.started}</td>
                      <td className={`${cell} text-right font-mono text-green-400`}>{data.completed}</td>
                      <td className={`${cell} text-right`}>
                        <span className="font-semibold text-xs text-amber-400">{pct(data.completed, data.started)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Checkout Abandonment ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Checkout Abandonment</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Before selecting method",  val: abandonBeforeMethod },
            { label: "After selecting method",   val: abandonAfterMethod  },
            { label: "After clicking payment",   val: abandonAfterPayment },
          ].map(({ label, val }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-red-400">{val}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* By plan */}
          {Object.keys(abandonByPlan).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">By Plan</p>
              <div className="space-y-2">
                {Object.entries(abandonByPlan).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                  <div key={plan} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">{PLAN_LABELS[plan] ?? plan}</span>
                    <span className="text-sm font-semibold text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By device */}
          {Object.keys(abandonByDevice).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">By Device</p>
              <div className="space-y-2">
                {Object.entries(abandonByDevice).sort((a, b) => b[1] - a[1]).map(([dev, count]) => (
                  <div key={dev} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 capitalize">{dev}</span>
                    <span className="text-sm font-semibold text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By source */}
          {Object.keys(abandonBySource).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">By Source</p>
              <div className="space-y-2">
                {Object.entries(abandonBySource).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
                  <div key={src} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">{SOURCE_LABELS[src] ?? src}</span>
                    <span className="text-sm font-semibold text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── All Event Counts ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Raw Event Counts</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Event</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-right`}>Unique Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {CHECKOUT_FUNNEL_EVENTS.map(ev => (
                <tr key={ev}>
                  <td className={`${cell} font-mono text-xs`}>{ev}</td>
                  <td className={`${cell} text-right font-mono`}>{counts[ev] ?? 0}</td>
                  <td className={`${cell} text-right font-mono`}>{uniqueSessions(ev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Recent Events ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Recent 50 Events</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Time</th>
                <th className={th}>Event</th>
                <th className={th}>Source</th>
                <th className={th}>Plan</th>
                <th className={th}>Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recentEvents.map((e, i) => {
                const meta   = parseMeta(e.metadata);
                const plan   = (meta.plan as string) || (meta.selected_plan as string) || "—";
                const device = (meta.device_type as string) || "—";
                return (
                  <tr key={i}>
                    <td className={`${cell} font-mono text-xs text-zinc-500 whitespace-nowrap`}>
                      {new Date(e.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={`${cell} font-mono text-xs`}>{e.eventType}</td>
                    <td className={cell}>{SOURCE_LABELS[e.creator ?? ""] ?? e.creator ?? "—"}</td>
                    <td className={`${cell} text-xs text-zinc-400`}>{PLAN_LABELS[plan] ?? plan}</td>
                    <td className={`${cell} text-xs text-zinc-400 capitalize`}>{device}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
