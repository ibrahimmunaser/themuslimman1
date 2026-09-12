"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Languages,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Recipient {
  email: string;
  name: string;
  userId?: string;
  source: string;
  createdAt: string;
  blockReason: string | null;
  alreadySent: boolean;
  unsubscribed: boolean;
}

interface SendSummary {
  dryRun: boolean;
  sent: number;
  failed: number;
  skipped: number;
}

export default function LanguagesBlastPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    alreadySent: 0,
    unsubscribed: 0,
    blocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SendSummary | null>(null);
  const [override, setOverride] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/languages-blast/leads");
      if (!res.ok) throw new Error("Failed to load contacts");
      const data = await res.json();
      setRecipients(data.recipients ?? []);
      setStats({
        total: data.total ?? 0,
        eligible: data.eligible ?? 0,
        alreadySent: data.alreadySent ?? 0,
        unsubscribed: data.unsubscribed ?? 0,
        blocked: data.blocked ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eligibleList = useMemo(
    () =>
      recipients.filter(
        (r) =>
          !r.blockReason &&
          !r.unsubscribed &&
          (override || !r.alreadySent),
      ),
    [recipients, override],
  );

  async function sendAll(dryRun: boolean) {
    if (!eligibleList.length) return;
    const label = dryRun
      ? `Dry-run ${eligibleList.length} emails?`
      : `Send the 3-languages announcement to ${eligibleList.length} people? This cannot be undone.`;
    if (!window.confirm(label)) return;

    setSending(true);
    setError("");
    setSummary(null);

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Batch in chunks of 50 (API limit)
      for (let i = 0; i < eligibleList.length; i += 50) {
        const chunk = eligibleList.slice(i, i + 50).map((r) => ({
          email: r.email,
          name: r.name,
          userId: r.userId,
        }));
        const res = await fetch("/api/admin/languages-blast/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients: chunk, dryRun, override }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Send failed");
        sent += data.sent ?? 0;
        failed += data.failed ?? 0;
        skipped += data.skipped ?? 0;
      }
      setSummary({ dryRun, sent, failed, skipped });
      if (!dryRun) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Languages className="w-6 h-6 text-gold" />
            3 Languages Launch Email
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Email every contact we have (registered accounts + quiz/visitor leads)
            about English, Arabic, and French — with more languages planned — plus a
            WhatsApp share link. Skips unsubscribed, blocked, and already-sent addresses.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading || sending}
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-surface-raised"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          ["Total", stats.total],
          ["Eligible", stats.eligible],
          ["Already sent", stats.alreadySent],
          ["Unsubscribed", stats.unsubscribed],
          ["Blocked", stats.blocked],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
            <p className="text-xl font-bold text-text mt-1">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {summary && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {summary.dryRun ? "Dry run" : "Sent"}: {summary.sent} · failed {summary.failed} ·
          skipped {summary.skipped}
        </div>
      )}

      <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 mb-6">
        <p className="text-sm font-semibold text-text mb-1">Subject</p>
        <p className="text-sm text-text-secondary mb-3">
          Complete Seerah is now in English, Arabic &amp; French
        </p>
        <p className="text-xs text-text-muted">
          Includes Try Part 1 Free CTA + Share on WhatsApp button. Respects unsubscribe list.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
          />
          Re-send to people who already got this email
        </label>
        <div className="flex-1" />
        <button
          disabled={sending || !eligibleList.length}
          onClick={() => sendAll(true)}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-surface-raised disabled:opacity-50"
        >
          Dry run ({eligibleList.length})
        </button>
        <button
          disabled={sending || !eligibleList.length}
          onClick={() => sendAll(false)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-gold text-ink hover:bg-gold-light disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : `Send to ${eligibleList.length}`}
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-raised text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Source</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recipients.slice(0, 500).map((r) => {
                let status = "eligible";
                let tone = "text-emerald-400";
                if (r.blockReason) {
                  status = r.blockReason;
                  tone = "text-red-400";
                } else if (r.unsubscribed) {
                  status = "unsubscribed";
                  tone = "text-zinc-400";
                } else if (r.alreadySent) {
                  status = "already sent";
                  tone = "text-amber-400";
                }
                return (
                  <tr key={r.email} className="border-t border-border/60">
                    <td className="px-3 py-2 text-text">{r.email}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.name || "—"}</td>
                    <td className="px-3 py-2 text-text-muted">{r.source}</td>
                    <td className={`px-3 py-2 ${tone}`}>
                      {status === "eligible" ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {recipients.length > 500 && (
          <p className="text-xs text-text-muted px-3 py-2 border-t border-border">
            Showing first 500 of {recipients.length}
          </p>
        )}
      </div>
    </div>
  );
}
