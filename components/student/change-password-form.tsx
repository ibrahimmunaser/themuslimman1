"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLong = next.length >= 8;
  const matches = next.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && isLong && matches && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-secondary hover:text-text hover:border-gold/40 transition-all text-sm cursor-pointer"
      >
        Change Password
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      {/* Current password */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Current password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder="Enter current password"
            className="w-full px-4 py-2 pr-10 rounded-lg bg-surface-raised border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors text-sm"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">New password</label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={e => setNext(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-4 py-2 pr-10 rounded-lg bg-surface-raised border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors text-sm"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNext(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {next.length > 0 && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${isLong ? "text-emerald-400" : "text-text-muted"}`}>
            {isLong ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            At least 8 characters
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Re-enter new password"
          className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors text-sm"
          autoComplete="new-password"
        />
        {confirm.length > 0 && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${matches ? "text-emerald-400" : "text-red-400"}`}>
            {matches ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {matches ? "Passwords match" : "Passwords don't match"}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light disabled:opacity-50 text-ink text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {success ? (
            <><Check className="w-4 h-4" /> Updated</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            "Update Password"
          )}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCurrent(""); setNext(""); setConfirm(""); setError(null); }}
          className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
