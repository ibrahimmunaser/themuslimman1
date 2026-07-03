import {
  getCheckoutAnalyticsData,
  pct,
  PLAN_LABELS,
  SOURCE_LABELS,
  CHECKOUT_ANALYTICS_REPORTING_START,
  CHECKOUT_ANALYTICS_SCHEMA,
} from "@/lib/queries/checkout-analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout Analytics | Admin" };

const ABANDON_LABELS: Record<string, string> = {
  before_payment_element_loaded: "Before payment form ready",
  after_payment_element_loaded_before_payment_started: "Form ready, before payment started",
  after_payment_started: "After payment started (no purchase)",
  payment_failed_not_recovered: "Payment failed (not recovered)",
  payment_cancelled: "Payment cancelled",
};

export default async function CheckoutAnalyticsPage() {
  const data = await getCheckoutAnalyticsData();
  const { funnel, sequentialFunnel } = data;

  const cell = "px-3 py-2 text-sm text-zinc-300";
  const th = "px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-left";

  const reportingLabel = CHECKOUT_ANALYTICS_REPORTING_START.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Checkout Analytics</h1>
        <p className="text-sm text-zinc-500">
          Attempt-based funnel from plan selection → checkout → server-confirmed purchase.
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Reporting from {reportingLabel} · schema <code className="text-zinc-400">{CHECKOUT_ANALYTICS_SCHEMA}</code>
          {" · "}
          {data.includedEvents.toLocaleString()} events included ·{" "}
          {data.excludedLegacyEvents.toLocaleString()} pre-deployment events excluded
          {data.unlinkedPurchases > 0 && (
            <> · {data.unlinkedPurchases} server purchase(s) not linked to a checkout attempt</>
          )}
        </p>
      </div>

      {/* Definitions */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-1">
        <p className="font-semibold text-zinc-300 mb-2">Metric definitions</p>
        <p><strong className="text-zinc-300">Checkout attempt</strong> — explicit <code>checkout_attempt_id</code> minted on <code>checkout_clicked</code> or direct <code>/checkout</code> entry; all checkout events share it.</p>
        <p><strong className="text-zinc-300">Plan selected</strong> — one event per explicit plan-card click (deduped per interaction; ignores synthetic/non-trusted events).</p>
        <p><strong className="text-zinc-300">Purchase</strong> — server-side <code>purchase_completed</code> only (not client <code>payment_succeeded</code>).</p>
        <p><strong className="text-zinc-300">Checkout loaded</strong> — React checkout page mounted.</p>
        <p><strong className="text-zinc-300">Payment form ready</strong> — <code>payment_element_loaded</code> (Stripe PaymentElement interactive).</p>
        <p><strong className="text-zinc-300">Method presented</strong> — <code>payment_method_presented</code> when Stripe shows default/interactive form (not a user selection).</p>
        <p><strong className="text-zinc-300">Method selected</strong> — <code>payment_method_selected</code> only when the user changes payment method.</p>
        <p><strong className="text-zinc-300">Payment started</strong> — <code>checkout_payment_started</code> / <code>payment_started</code> (user initiated pay).</p>
        <p><strong className="text-zinc-300">Raw events</strong> — shown separately below; not mixed into funnel CVR tables.</p>
      </section>

      {/* Funnel Overview */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Funnel Overview (unique checkout attempts)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Plan Selected (sessions)", val: funnel.planSelectedSessions, color: "zinc" as const },
            { label: "Checkout Loaded", val: funnel.checkoutLoaded, color: "blue" as const },
            { label: "Payment Form Ready", val: funnel.paymentElementLoaded, color: "zinc" as const },
            { label: "Method Available", val: funnel.paymentMethodAvailable, color: "zinc" as const },
            { label: "Payment Started", val: funnel.paymentStarted, color: "gold" as const },
            { label: "Purchase Completed", val: funnel.purchaseCompleted, color: "green" as const },
            { label: "Payment Failed", val: funnel.paymentFailed, color: "red" as const },
            { label: "Abandoned (no purchase)", val: funnel.abandoned, color: "red" as const },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p
                className={`text-2xl font-bold ${
                  color === "green"
                    ? "text-green-400"
                    : color === "red"
                      ? "text-red-400"
                      : color === "gold"
                        ? "text-amber-400"
                        : color === "blue"
                          ? "text-blue-400"
                          : "text-white"
                }`}
              >
                {val}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Conversion Rates */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Sequential Conversion (same attempt / linked session)</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Funnel Step</th>
                <th className={`${th} text-right`}>Attempts</th>
                <th className={`${th} text-right`}>Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[
                {
                  label: "Plan selected → Checkout loaded (same session, ordered)",
                  ...sequentialFunnel.planToLoaded,
                },
                {
                  label: "Checkout loaded → Payment form ready",
                  ...sequentialFunnel.loadedToElement,
                },
                {
                  label: "Payment form ready → Payment started",
                  ...sequentialFunnel.elementToStarted,
                },
                {
                  label: "Payment started → Purchase completed (server)",
                  ...sequentialFunnel.startedToPurchase,
                },
                {
                  label: "Checkout loaded → Purchase completed (server)",
                  ...sequentialFunnel.loadedToPurchase,
                },
              ].map((row) => (
                <tr key={row.label}>
                  <td className={cell}>{row.label}</td>
                  <td className={`${cell} text-right font-mono`}>{row.num}</td>
                  <td className={`${cell} text-right`}>
                    <span
                      className={`font-semibold ${
                        row.num / (row.den || 1) > 0.5
                          ? "text-green-400"
                          : row.num / (row.den || 1) > 0.2
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {pct(row.num, row.den)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Breakdown by Plan */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Plan (unique attempts)</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Plan</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Purchased</th>
                <th className={`${th} text-right`}>Abandoned</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.breakdownByPlan.map((row) => (
                <tr key={row.plan}>
                  <td className={cell}>{PLAN_LABELS[row.plan] ?? row.plan}</td>
                  <td className={`${cell} text-right font-mono`}>{row.loaded}</td>
                  <td className={`${cell} text-right font-mono`}>{row.started}</td>
                  <td className={`${cell} text-right font-mono text-green-400`}>{row.purchased}</td>
                  <td className={`${cell} text-right font-mono text-red-400`}>{row.abandoned}</td>
                  <td className={`${cell} text-right`}>
                    <span className="font-semibold text-xs text-amber-400">{pct(row.purchased, row.loaded)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-950/50 border-t border-zinc-800">
              <tr>
                <td className={`${cell} font-semibold text-zinc-400`}>Total</td>
                <td className={`${cell} text-right font-mono font-semibold`}>{funnel.checkoutLoaded}</td>
                <td className={`${cell} text-right font-mono font-semibold`}>{funnel.paymentStarted}</td>
                <td className={`${cell} text-right font-mono font-semibold text-green-400`}>{funnel.purchaseCompleted}</td>
                <td className={`${cell} text-right font-mono font-semibold text-red-400`}>{funnel.abandoned}</td>
                <td className={`${cell} text-right font-semibold text-xs`}>{pct(funnel.purchaseCompleted, funnel.checkoutLoaded)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Breakdown by Source */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Source / Influencer (unique attempts)</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Source</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Purchased</th>
                <th className={`${th} text-right`}>Abandoned</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.breakdownBySource.map((row) => (
                <tr key={row.source}>
                  <td className={cell}>{SOURCE_LABELS[row.source] ?? row.source}</td>
                  <td className={`${cell} text-right font-mono`}>{row.loaded}</td>
                  <td className={`${cell} text-right font-mono`}>{row.started}</td>
                  <td className={`${cell} text-right font-mono text-green-400`}>{row.purchased}</td>
                  <td className={`${cell} text-right font-mono text-red-400`}>{row.abandoned}</td>
                  <td className={`${cell} text-right`}>
                    <span className="font-semibold text-xs text-amber-400">{pct(row.purchased, row.loaded)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Breakdown by Device */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Breakdown by Device (unique attempts, device inherited from session)</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className={th}>Device</th>
                <th className={`${th} text-right`}>Loaded</th>
                <th className={`${th} text-right`}>Started</th>
                <th className={`${th} text-right`}>Purchased</th>
                <th className={`${th} text-right`}>Cvr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.breakdownByDevice.map((row) => (
                <tr key={row.device}>
                  <td className={`${cell} capitalize`}>{row.device}</td>
                  <td className={`${cell} text-right font-mono`}>{row.loaded}</td>
                  <td className={`${cell} text-right font-mono`}>{row.started}</td>
                  <td className={`${cell} text-right font-mono text-green-400`}>{row.purchased}</td>
                  <td className={`${cell} text-right`}>
                    <span className="font-semibold text-xs text-amber-400">{pct(row.purchased, row.loaded)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment Method Availability */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Payment Method Availability (unique attempts)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Apple Pay Available", val: data.methodAvailability.applePayAttempts, total: data.methodAvailability.totalChecks, color: "green" as const },
            { label: "Google Pay Available", val: data.methodAvailability.googlePayAttempts, total: data.methodAvailability.totalChecks, color: "blue" as const },
            { label: "Card Only", val: data.methodAvailability.cardOnlyAttempts, total: data.methodAvailability.totalChecks, color: "zinc" as const },
            { label: "Checks Recorded", val: data.methodAvailability.totalChecks, total: data.methodAvailability.totalChecks, color: "zinc" as const },
          ].map(({ label, val, total, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color === "green" ? "text-green-400" : color === "blue" ? "text-blue-400" : "text-white"}`}>{val}</p>
              {total > 0 && label !== "Checks Recorded" && (
                <p className="text-xs text-zinc-600 mt-0.5">{pct(val, total)} of attempts with availability check</p>
              )}
            </div>
          ))}
        </div>

        {Object.keys(data.methodByPayment).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className={th}>Payment Method</th>
                  <th className={`${th} text-right`}>Attempts Started</th>
                  <th className={`${th} text-right`}>Purchased</th>
                  <th className={`${th} text-right`}>Purchase Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {Object.entries(data.methodByPayment)
                  .sort((a, b) => b[1].started - a[1].started)
                  .map(([method, stats]) => (
                    <tr key={method}>
                      <td className={`${cell} capitalize`}>
                        {method.replace("applePay", "Apple Pay").replace("googlePay", "Google Pay")}
                      </td>
                      <td className={`${cell} text-right font-mono`}>{stats.started}</td>
                      <td className={`${cell} text-right font-mono text-green-400`}>{stats.completed}</td>
                      <td className={`${cell} text-right`}>
                        <span className="font-semibold text-xs text-amber-400">{pct(stats.completed, stats.started)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Abandonment */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Abandonment (one stage per attempt, mutually exclusive)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {Object.entries(data.abandonment.byStage).map(([stage, val]) => (
            <div key={stage} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{ABANDON_LABELS[stage] ?? stage}</p>
              <p className="text-xl font-bold text-red-400">{val}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mb-4">
          Total abandoned attempts: {funnel.abandoned} (matches sum of stages above when all non-purchase attempts are classified).
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "By Plan", data: data.abandonment.byPlan, labelFn: (k: string) => PLAN_LABELS[k] ?? k },
            { title: "By Device", data: data.abandonment.byDevice, labelFn: (k: string) => k },
            { title: "By Source", data: data.abandonment.bySource, labelFn: (k: string) => SOURCE_LABELS[k] ?? k },
          ].map(({ title, data: map, labelFn }) =>
            Object.keys(map).length > 0 ? (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">{title}</p>
                <div className="space-y-2">
                  {Object.entries(map)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, count]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400 capitalize">{labelFn(key)}</span>
                        <span className="text-sm font-semibold text-red-400">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </section>

      {/* Payment cancelled trace */}
      {data.paymentCancelledTrace.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-zinc-300 mb-3">payment_cancelled traceability</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Attempt</th>
                  <th className={th}>Plan</th>
                  <th className={th}>Purchased?</th>
                  <th className={th}>Abandonment stage</th>
                  <th className={th}>Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.paymentCancelledTrace.map((row, i) => (
                  <tr key={i}>
                    <td className={`${cell} font-mono text-xs text-zinc-500 whitespace-nowrap`}>
                      {new Date(row.eventAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={`${cell} font-mono text-xs`}>{row.checkoutAttemptId ?? "—"}</td>
                    <td className={cell}>{PLAN_LABELS[row.plan] ?? row.plan}</td>
                    <td className={cell}>{row.completedPurchase ? "Yes" : "No"}</td>
                    <td className={cell}>{row.abandonmentStage ?? "—"}</td>
                    <td className={`${cell} text-xs text-zinc-400`}>{row.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Raw Event Counts */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Raw Event Counts (post-deployment only)</h2>
        <p className="text-xs text-zinc-600 mb-3">Diagnostic only — do not use for CVR. Client <code>payment_succeeded</code> shown for comparison.</p>
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
              {data.rawCounts.map((row) => (
                <tr key={row.eventType}>
                  <td className={`${cell} font-mono text-xs`}>{row.eventType}</td>
                  <td className={`${cell} text-right font-mono`}>{row.total}</td>
                  <td className={`${cell} text-right font-mono`}>{row.uniqueSessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Events */}
      <section>
        <h2 className="text-base font-semibold text-zinc-300 mb-3">Recent 50 Events (post-deployment)</h2>
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
              {data.recentEvents.map((e, i) => (
                <tr key={i}>
                  <td className={`${cell} font-mono text-xs text-zinc-500 whitespace-nowrap`}>
                    {new Date(e.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className={`${cell} font-mono text-xs`}>{e.eventType}</td>
                  <td className={cell}>{SOURCE_LABELS[e.creator] ?? e.creator}</td>
                  <td className={`${cell} text-xs text-zinc-400`}>{PLAN_LABELS[e.plan] ?? e.plan}</td>
                  <td className={`${cell} text-xs text-zinc-400 capitalize`}>{e.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
