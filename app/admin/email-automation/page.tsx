"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail, RefreshCw, Play, PauseCircle, AlertTriangle,
  CheckCircle2, XCircle, Clock, BarChart3,
} from "lucide-react";

interface Stats {
  eligibleStep1:  number;
  eligibleStep2:  number;
  totalSentStep1: number;
  totalSentStep2: number;
  totalFailed:    number;
  totalSkipped:   number;
  recentLogs:     LogEntry[];
}

interface LogEntry {
  id:        string;
  email:     string;
  step:      number;
  status:    "SENT" | "FAILED" | "SKIPPED";
  subject:   string;
  sentAt:    string;
  error:     string | null;
}

interface DryRunResult {
  step1: { eligible: number; sent: number; skipped: number; failed: number };
  step2: { eligible: number; sent: number; skipped: number; failed: number };
}

const PAUSE_KEY = "no_plan_recovery_paused";

export default function EmailAutomationPage() {
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [running, setRunning]         = useState(false);
  const [paused, setPaused]           = useState(false);
  const [lastRun, setLastRun]         = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

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

  const statusIcon = (status: string) => {
    if (status === "SENT")    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === "FAILED")  return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold uppercase tracking-wider font-semibold">Email Automation</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">No-plan recovery</h1>
        <p className="text-text-secondary mt-1 text-sm">
          2-step email flow for users who verified their account but never purchased a plan.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Pause banner */}
      {paused && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <PauseCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">Automation is paused. The cron will still run but trigger will be blocked from this panel.</p>
        </div>
      )}

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Eligible Step 1",  value: stats.eligibleStep1,  tone: "gold"  },
            { label: "Eligible Step 2",  value: stats.eligibleStep2,  tone: "gold"  },
            { label: "Sent Step 1",      value: stats.totalSentStep1, tone: "green" },
            { label: "Sent Step 2",      value: stats.totalSentStep2, tone: "green" },
            { label: "Skipped",          value: stats.totalSkipped,   tone: "zinc"  },
            { label: "Failed sends",     value: stats.totalFailed,    tone: "red"   },
          ].map((card) => (
            <div key={card.label} className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${
                card.tone === "gold"  ? "text-gold" :
                card.tone === "green" ? "text-green-400" :
                card.tone === "red"   ? "text-red-400" :
                "text-text"
              }`}>{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
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
      </div>

      {/* Dry-run result */}
      {dryRunResult && (
        <div className="mb-6 p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
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
        <p className="text-xs text-text-muted mb-4">Last manual run: {lastRun}</p>
      )}

      {/* Recent logs */}
      {stats && stats.recentLogs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text mb-3">Recent logs</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Step</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden sm:table-cell">Sent at</th>
                  <th className="text-left px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Error</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? "bg-surface" : "bg-surface/50"}>
                    <td className="px-4 py-3 text-text truncate max-w-[180px]">{log.email}</td>
                    <td className="px-4 py-3 text-text-muted">Step {log.step}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <span className={
                          log.status === "SENT"   ? "text-green-400" :
                          log.status === "FAILED" ? "text-red-400"   : "text-zinc-400"
                        }>{log.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-400 text-xs hidden md:table-cell truncate max-w-[200px]">
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
      <div className="mt-8 p-5 rounded-xl bg-surface border border-border">
        <h2 className="text-sm font-semibold text-text mb-3">Flow summary</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><strong className="text-text">Step 1</strong> — Sent 3 hours after verified signup. Subject: "The first lesson is unlocked". CTA: Watch Part 1 Free.</p>
          <p><strong className="text-text">Step 2</strong> — Sent 24 hours after Step 1. Subject: "Most Muslims learn scattered stories". CTAs: Continue Part 1 + View Plans.</p>
          <p><strong className="text-text">Stop condition</strong> — Flow stops immediately once the user purchases any plan. Max 2 emails.</p>
          <p><strong className="text-text">Schedule</strong> — Cron runs daily at 8:00 AM UTC automatically.</p>
        </div>
      </div>
    </div>
  );
}
