"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail, RefreshCw, Play, PauseCircle, AlertTriangle,
  CheckCircle2, XCircle, Clock, BarChart3, Users,
  Send, UserX, ArrowRight, Zap,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  // Auto-flow
  eligibleStep1:  number;
  eligibleStep2:  number;
  totalSentStep1: number;
  totalSentStep2: number;
  totalFailed:    number;
  totalSkipped:   number;
  // Manual outreach
  manualSent:     number;
  manualFailed:   number;
  // Totals
  totalEmailsSent:          number;
  totalNonPurchasers:       number;
  uncontactedNonPurchasers: number;
  // Unified logs
  recentLogs: UnifiedLog[];
}

interface UnifiedLog {
  id:      string;
  email:   string;
  source:  "automation" | "manual";
  step:    number | null;
  status:  string;
  subject: string | null;
  sentAt:  string;
  error:   string | null;
}

interface DryRunResult {
  step1: { eligible: number; sent: number; skipped: number; failed: number };
  step2: { eligible: number; sent: number; skipped: number; failed: number };
}

const PAUSE_KEY = "no_plan_recovery_paused";

function statusIcon(status: string) {
  if (status === "SENT")    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "FAILED")  return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-zinc-400" />;
}

export default function EmailAutomationPage() {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [running, setRunning]           = useState(false);
  const [paused, setPaused]             = useState(false);
  const [lastRun, setLastRun]           = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "automation" | "manual">("all");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-automation/stats");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStats(data);
      setPaused(!!localStorage.getItem(PAUSE_KEY));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const runDryRun = async () => {
    setRunning(true);
    setDryRunResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-automation/trigger?dryRun=1", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDryRunResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dry run failed");
    } finally {
      setRunning(false);
    }
  };

  const runNow = async () => {
    if (paused) return;
    setRunning(true);
    setDryRunResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-automation/trigger", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setLastRun(new Date().toLocaleString());
      await fetchStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const togglePause = () => {
    if (paused) {
      localStorage.removeItem(PAUSE_KEY);
      setPaused(false);
    } else {
      localStorage.setItem(PAUSE_KEY, "1");
      setPaused(true);
    }
  };

  const filteredLogs = stats?.recentLogs.filter((l) =>
    sourceFilter === "all" ? true : l.source === sourceFilter
  ) ?? [];

  const coveragePct = stats && stats.totalNonPurchasers > 0
    ? Math.round(((stats.totalNonPurchasers - stats.uncontactedNonPurchasers) / stats.totalNonPurchasers) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold uppercase tracking-wider font-semibold">Admin · Email Automation</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">Email Automation</h1>
        <p className="text-text-secondary mt-1 text-sm">
          All emails sent to non-purchasers — automated recovery flow and manual outreach.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Pause banner */}
      {paused && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <PauseCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">Automation is paused. The daily cron still runs but manual trigger is blocked.</p>
        </div>
      )}

      {/* Non-purchaser reach banner */}
      {!loading && stats && stats.uncontactedNonPurchasers > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <UserX className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {stats.uncontactedNonPurchasers} non-purchasers have never received an email
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Click &ldquo;Send now&rdquo; to run the automated flow, or use Manual Outreach for direct sends.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={runNow}
              disabled={running || paused}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              Send now
            </button>
            <Link
              href="/admin/email-outreach"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised border border-border text-xs font-medium text-text transition-colors"
            >
              Manual outreach <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Top KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* Reach overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Non-purchasers",  value: stats.totalNonPurchasers,       tone: "amber", icon: Users,         sub: "verified, no plan" },
              { label: "Total sent",      value: stats.totalEmailsSent,           tone: "blue",  icon: Send,          sub: "all flows combined" },
              { label: "Coverage",        value: `${coveragePct}%`,               tone: "green", icon: CheckCircle2,  sub: "of non-purchasers" },
              { label: "Never emailed",   value: stats.uncontactedNonPurchasers,  tone: "red",   icon: UserX,         sub: "unreached" },
            ].map(({ label, value, tone, icon: Icon, sub }) => (
              <div key={label} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${
                    tone === "amber" ? "text-amber-400" :
                    tone === "blue"  ? "text-blue-400"  :
                    tone === "green" ? "text-green-400" : "text-red-400"
                  }`} />
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${
                  tone === "amber" ? "text-amber-400" :
                  tone === "blue"  ? "text-blue-400"  :
                  tone === "green" ? "text-green-400" : "text-red-400"
                }`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
                <p className="text-xs text-text-muted mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Flow breakdown */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">By flow</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Auto Step 1",   value: stats.totalSentStep1, tone: "green" },
                { label: "Auto Step 2",   value: stats.totalSentStep2, tone: "green" },
                { label: "Manual sent",   value: stats.manualSent,     tone: "blue"  },
                { label: "Eligible S1",   value: stats.eligibleStep1,  tone: "gold"  },
                { label: "Eligible S2",   value: stats.eligibleStep2,  tone: "gold"  },
                { label: "Failed (all)",  value: stats.totalFailed + stats.manualFailed, tone: stats.totalFailed + stats.manualFailed > 0 ? "red" : "zinc" },
              ].map(({ label, value, tone }) => (
                <div key={label} className="text-center">
                  <p className={`text-xl font-bold tabular-nums ${
                    tone === "green" ? "text-green-400" :
                    tone === "blue"  ? "text-blue-400"  :
                    tone === "gold"  ? "text-gold"       :
                    tone === "red"   ? "text-red-400"    : "text-text"
                  }`}>{value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium hover:border-zinc-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          onClick={runDryRun}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium hover:border-zinc-600 transition-colors disabled:opacity-50"
        >
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Dry run
        </button>

        <button
          onClick={runNow}
          disabled={running || paused}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/20 transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {running ? "Sending…" : "Send now"}
        </button>

        <button
          onClick={togglePause}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            paused
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
              : "bg-surface border-border hover:border-zinc-600"
          }`}
        >
          <PauseCircle className="w-4 h-4" />
          {paused ? "Resume" : "Pause"}
        </button>

        <Link
          href="/admin/email-outreach"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium hover:border-zinc-600 transition-colors"
        >
          <Send className="w-4 h-4 text-blue-400" />
          Manual Outreach
        </Link>
      </div>

      {/* Dry-run result */}
      {dryRunResult && (
        <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Dry run result — no emails sent
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Step 1 would send",  value: dryRunResult.step1.sent    },
              { label: "Step 1 would skip",  value: dryRunResult.step1.skipped },
              { label: "Step 2 would send",  value: dryRunResult.step2.sent    },
              { label: "Step 2 would skip",  value: dryRunResult.step2.skipped },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-text-secondary">{r.label}</span>
                <span className="font-semibold text-text">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastRun && (
        <p className="text-xs text-text-muted">Last manual run: {lastRun}</p>
      )}

      {/* Unified recent logs */}
      {stats && stats.recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-text">
              All sent emails
              <span className="ml-2 text-sm font-normal text-text-muted">({stats.recentLogs.length} most recent)</span>
            </h2>
            {/* Source filter */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 text-xs font-medium">
              {(["all", "automation", "manual"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-3 py-1 rounded-md transition-colors capitalize ${
                    sourceFilter === f
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden sm:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Sent at</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden lg:table-cell">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 text-text truncate max-w-[180px]">{log.email}</td>
                    <td className="px-4 py-3">
                      {log.source === "automation" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gold/10 text-gold border border-gold/20">
                          Auto{log.step !== null ? ` S${log.step}` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <span className={
                          log.status === "SENT"   ? "text-green-400" :
                          log.status === "FAILED" ? "text-red-400"   : "text-zinc-400"
                        }>{log.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell truncate max-w-[200px]">
                      {log.subject ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-400 text-xs hidden lg:table-cell truncate max-w-[180px]">
                      {log.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flow summary */}
      <div className="p-5 rounded-xl bg-surface border border-border">
        <h2 className="text-sm font-semibold text-text mb-3">How it works</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><strong className="text-text">Step 1 (Auto)</strong> — Sent 3 hours after verified signup to anyone without a plan. Subject: &ldquo;The first lesson is unlocked&rdquo;. CTA: Watch Part 1 Free.</p>
          <p><strong className="text-text">Step 2 (Auto)</strong> — Sent 24 hours after Step 1. Subject: &ldquo;Most Muslims learn scattered stories&rdquo;. CTAs: Continue Part 1 + View Plans.</p>
          <p><strong className="text-text">Manual outreach</strong> — One-off sends to selected non-purchasers via the <Link href="/admin/email-outreach" className="text-gold hover:underline">Email Outreach</Link> page. Shown here as &ldquo;Manual&rdquo; rows in the log.</p>
          <p><strong className="text-text">Stop condition</strong> — All flows stop once the user purchases any plan. Max 2 automated emails per user.</p>
          <p><strong className="text-text">Schedule</strong> — Automated cron runs daily at 8:00 AM UTC. Use &ldquo;Send now&rdquo; to trigger manually.</p>
        </div>
      </div>

    </div>
  );
}
