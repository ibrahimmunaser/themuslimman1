"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mail, RefreshCw, Search, Filter, CheckSquare, Square,
  Send, Eye, BarChart3, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronLeft, ChevronRight, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id:               string;
  fullName:         string;
  email:            string;
  emailVerified:    boolean;
  hasPaidAccess:    boolean;
  planLabel:        string | null;
  lastManualSent:   string | null;
  lastManualStatus: string | null;
  autoStep1Sent:    string | null;
  autoStep2Sent:    string | null;
  unsubscribed:     boolean;
  source:           string | null;
  createdAt:        string;
  blockReason:      string | null;
}

interface SendResult {
  email:  string;
  name:   string;
  status: "SENT" | "FAILED" | "SKIPPED";
  reason?: string;
  error?:  string;
}

interface SendSummary {
  dryRun:  boolean;
  sent:    number;
  failed:  number;
  skipped: number;
  results: SendResult[];
}

interface Filters {
  verifiedOnly: boolean;
  noPlanOnly:   boolean;
  neverEmailed: boolean;
  excludeTest:  boolean;
}

const DEFAULT_FILTERS: Filters = {
  verifiedOnly: true,
  noPlanOnly:   true,
  neverEmailed: false,
  excludeTest:  true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, string> = {
    SENT:    "text-green-400 bg-green-400/10",
    FAILED:  "text-red-400 bg-red-400/10",
    SKIPPED: "text-zinc-400 bg-zinc-400/10",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${map[status] ?? "text-zinc-400"}`}>
      {status}
    </span>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal(props: {
  selectedCount: number;
  eligibleCount: number;
  skippedCount:  number;
  skippedReasons: Record<string, number>;
  dryRun:        boolean;
  override:      boolean;
  onCancel:      () => void;
  onConfirm:     () => void;
  sending:       boolean;
}) {
  const { selectedCount, eligibleCount, skippedCount, skippedReasons, dryRun, onCancel, onConfirm, sending } = props;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text text-lg">
            {dryRun ? "Dry run" : "Confirm send"}
          </h3>
          <button onClick={onCancel} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm mb-5">
          <div className="flex justify-between"><span className="text-text-muted">Selected</span><span className="font-semibold text-text">{selectedCount}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Will send to</span><span className="font-semibold text-green-400">{eligibleCount}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Will skip</span><span className="font-semibold text-zinc-400">{skippedCount}</span></div>
        </div>

        {skippedCount > 0 && (
          <div className="mb-5 p-3 rounded-xl bg-zinc-800/50 border border-border">
            <p className="text-xs text-text-muted mb-2 font-medium">Skip reasons:</p>
            {Object.entries(skippedReasons).map(([reason, count]) => (
              <div key={reason} className="flex justify-between text-xs">
                <span className="text-zinc-400">{reason}</span>
                <span className="text-zinc-300">{count}</span>
              </div>
            ))}
          </div>
        )}

        {!dryRun && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            This will send <strong>{eligibleCount}</strong> individual emails. This action cannot be undone.
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:border-zinc-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
              dryRun
                ? "bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25"
                : "bg-gold/15 border border-gold/40 text-gold hover:bg-gold/25"
            }`}
          >
            {sending ? "Sending…" : dryRun ? "Run dry run" : `Send ${eligibleCount} emails`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal(props: { onClose: () => void }) {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetch("/api/admin/outreach/preview?name=Ibrahim")
      .then((r) => r.text())
      .then(setHtml);
  }, []);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text">Email preview</h3>
          <button onClick={props.onClose} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-white rounded-b-2xl">
          {html
            ? <iframe srcDoc={html} className="w-full h-full border-0 rounded-b-2xl" title="Email preview" />
            : <div className="flex items-center justify-center h-full"><RefreshCw className="w-5 h-5 animate-spin text-zinc-400" /></div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Results modal ────────────────────────────────────────────────────────────

function ResultsModal(props: { summary: SendSummary; onClose: () => void }) {
  const { summary, onClose } = props;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text">
            {summary.dryRun ? "Dry run results" : "Send results"}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 border-b border-border grid grid-cols-3 gap-3">
          {[
            { label: summary.dryRun ? "Would send" : "Sent",    value: summary.sent,    color: "text-green-400" },
            { label: "Skipped",  value: summary.skipped, color: "text-zinc-400" },
            { label: "Failed",   value: summary.failed,  color: "text-red-400"   },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto px-5 py-3 space-y-1.5">
          {summary.results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {r.status === "SENT"    && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
              {r.status === "FAILED"  && <XCircle      className="w-4 h-4 text-red-400 flex-shrink-0" />}
              {r.status === "SKIPPED" && <Clock        className="w-4 h-4 text-zinc-400 flex-shrink-0" />}
              <span className="truncate text-text">{r.email}</span>
              {(r.reason || r.error) && (
                <span className="text-xs text-zinc-500 truncate ml-auto">{r.reason ?? r.error}</span>
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-border">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-surface border border-border text-sm font-medium text-text hover:border-zinc-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailOutreachPage() {
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [override, setOverride] = useState(false);

  const [showPreview,  setShowPreview]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [confirmDryRun, setConfirmDryRun] = useState(false);
  const [confirmSendAll, setConfirmSendAll] = useState(false);
  const [sending,      setSending]      = useState(false);
  const [summary,      setSummary]      = useState<SendSummary | null>(null);

  const LIMIT = 100;

  // ── Load leads ────────────────────────────────────────────────────────────

  const loadLeads = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page:  String(p),
        limit: String(LIMIT),
        ...(filters.verifiedOnly ? { verifiedOnly: "1" } : {}),
        ...(filters.noPlanOnly   ? { noPlanOnly:   "1" } : {}),
        ...(filters.neverEmailed ? { neverEmailed: "1" } : {}),
        ...(filters.excludeTest  ? { excludeTest:  "1" } : {}),
      });
      const res  = await fetch(`/api/admin/outreach/leads?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLeads(data.leads);
      setTotal(data.total);
      setPage(p);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadLeads(1); }, [loadLeads]);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const visibleLeads = leads.filter((l) =>
    !search || l.email.toLowerCase().includes(search.toLowerCase()) || l.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const selectAll = () => setSelected(new Set(visibleLeads.map((l) => l.id)));
  const clearAll  = () => setSelected(new Set());

  const selectedLeads = leads.filter((l) => selected.has(l.id));

  // ── Pre-flight eligibility check ──────────────────────────────────────────

  function getEligibilitySummary(pool: Lead[]) {
    const reasons: Record<string, number> = {};
    const eligible: Lead[] = [];

    for (const l of pool) {
      const skips: string[] = [];
      if (l.blockReason)   skips.push(l.blockReason);
      if (l.unsubscribed)  skips.push("unsubscribed");
      if (l.hasPaidAccess) skips.push("has paid access");
      if (!override && l.lastManualStatus === "SENT") skips.push("already received outreach");

      if (skips.length) {
        skips.forEach((s) => { reasons[s] = (reasons[s] ?? 0) + 1; });
      } else {
        eligible.push(l);
      }
    }
    return { eligible, skipped: pool.length - eligible.length, reasons };
  }

  // ── Send handlers ─────────────────────────────────────────────────────────

  const openConfirm = (dryRun: boolean, sendAll: boolean) => {
    setConfirmDryRun(dryRun);
    setConfirmSendAll(sendAll);
    setShowConfirm(true);
  };

  const handleSend = async () => {
    const pool      = confirmSendAll ? visibleLeads : selectedLeads;
    const { eligible } = getEligibilitySummary(pool);
    const toSend    = eligible.slice(0, 50);

    setSending(true);
    try {
      const res = await fetch("/api/admin/outreach/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          recipients: toSend.map((l) => ({ userId: l.id, email: l.email, name: l.fullName })),
          dryRun:     confirmDryRun,
          override,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: SendSummary = await res.json();
      setSummary(data);
      setShowConfirm(false);
      if (!confirmDryRun) loadLeads(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  const pool         = confirmSendAll ? visibleLeads : selectedLeads;
  const { eligible: confirmEligible, skipped: confirmSkipped, reasons: confirmReasons } = getEligibilitySummary(pool);

  const totalPages = Math.ceil(total / LIMIT);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold uppercase tracking-wider font-semibold">Email Outreach</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">No Plan Email Outreach</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Send personalized recovery emails to unpaid users. One email per recipient — no BCC blasts.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder-zinc-500 focus:outline-none focus:border-gold/50 w-56"
          />
        </div>

        {/* Filter toggles */}
        {(Object.keys(DEFAULT_FILTERS) as Array<keyof Filters>).map((key) => {
          const labels: Record<keyof Filters, string> = {
            verifiedOnly: "Verified only",
            noPlanOnly:   "No plan only",
            neverEmailed: "Never emailed",
            excludeTest:  "Exclude test",
          };
          return (
            <button
              key={key}
              onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                filters[key]
                  ? "bg-gold/10 border-gold/40 text-gold"
                  : "bg-surface border-border text-text-muted hover:border-zinc-600"
              }`}
            >
              <Filter className="w-3 h-3" />
              {labels[key]}
            </button>
          );
        })}

        <button
          onClick={() => loadLeads(1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-muted hover:border-zinc-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer select-none ml-auto">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
            className="accent-gold"
          />
          Override already-emailed
        </label>
      </div>

      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-muted">
          {selected.size > 0 ? `${selected.size} selected` : `${visibleLeads.length} shown of ${total} total`}
        </span>

        <button onClick={selected.size === visibleLeads.length ? clearAll : selectAll}
          className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors">
          {selected.size === visibleLeads.length && visibleLeads.length > 0
            ? <><CheckSquare className="w-3.5 h-3.5" />Deselect all</>
            : <><Square className="w-3.5 h-3.5" />Select all</>
          }
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:border-zinc-600 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Preview email
        </button>

        <button
          onClick={() => openConfirm(true, false)}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium hover:border-zinc-600 transition-colors disabled:opacity-40"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Dry run selected
        </button>

        <button
          onClick={() => openConfirm(false, false)}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" /> Send selected ({selected.size})
        </button>

        <button
          onClick={() => openConfirm(false, true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
        >
          <Send className="w-3.5 h-3.5" /> Send to all eligible
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="px-4 py-3 w-10"></th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Email</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Verified</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden lg:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden xl:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden xl:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Last outreach</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden lg:table-cell">Auto emails</th>
                <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Flags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visibleLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-text-muted text-sm">
                    No leads match the current filters.
                  </td>
                </tr>
              ) : (
                visibleLeads.map((lead, i) => {
                  const isSelected = selected.has(lead.id);
                  const isBlocked  = !!(lead.blockReason || lead.unsubscribed || lead.hasPaidAccess);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => toggleSelect(lead.id)}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-gold/5"
                          : i % 2 === 0
                          ? "bg-surface hover:bg-surface-raised"
                          : "bg-surface/50 hover:bg-surface-raised"
                      } ${isBlocked ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-gold" />
                          : <Square className="w-4 h-4 text-zinc-600" />
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-text max-w-[120px] truncate">{lead.fullName}</td>
                      <td className="px-4 py-3 text-text-muted max-w-[180px] truncate">{lead.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {lead.emailVerified
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                          : <Clock className="w-4 h-4 text-zinc-500" />
                        }
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs">
                        {lead.hasPaidAccess
                          ? <span className="text-green-400">{lead.planLabel ?? "Paid"}</span>
                          : <span className="text-zinc-500">No plan</span>
                        }
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-text-muted text-xs truncate max-w-[100px]">
                        {lead.source ?? "—"}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-text-muted text-xs">{fmtDate(lead.createdAt)}</td>
                      <td className="px-4 py-3 text-xs">
                        {lead.lastManualSent
                          ? <span className="flex items-center gap-1.5">{statusBadge(lead.lastManualStatus)}<span className="text-text-muted">{fmtTime(lead.lastManualSent)}</span></span>
                          : <span className="text-zinc-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-text-muted">
                        {lead.autoStep1Sent || lead.autoStep2Sent
                          ? `S1:${lead.autoStep1Sent ? fmtDate(lead.autoStep1Sent) : "—"} S2:${lead.autoStep2Sent ? fmtDate(lead.autoStep2Sent) : "—"}`
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {lead.blockReason  && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{lead.blockReason}</span>}
                          {lead.unsubscribed && <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700/60 text-zinc-400">unsub</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button
              onClick={() => loadLeads(page - 1)}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl border border-border bg-surface hover:border-zinc-600 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-text-muted" />
            </button>
            <button
              onClick={() => loadLeads(page + 1)}
              disabled={page === totalPages || loading}
              className="p-2 rounded-xl border border-border bg-surface hover:border-zinc-600 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}

      {showConfirm && (
        <ConfirmModal
          selectedCount={pool.length}
          eligibleCount={Math.min(confirmEligible.length, 50)}
          skippedCount={confirmSkipped}
          skippedReasons={confirmReasons}
          dryRun={confirmDryRun}
          override={override}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleSend}
          sending={sending}
        />
      )}

      {summary && <ResultsModal summary={summary} onClose={() => setSummary(null)} />}
    </div>
  );
}
