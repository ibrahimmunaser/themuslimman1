"use client";

import { useState } from "react";
import { Tv, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userName: string;
}

// Matches the TV's on-screen display format and the alphabet
// app/api/tv/link/start/route.ts generates codes from.
function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

export function ActivateForm({ userName }: Props) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Enter the 6-character code shown on your TV.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tv/link/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">TV connected</h1>
        <p className="text-text-secondary text-sm">
          Your Seerah Course access is now unlocked on your TV. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
          <Tv className="w-5 h-5 text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Activate your TV</h1>
        <p className="text-text-secondary text-sm">
          Hi {userName}. Enter the code shown on your TV screen to unlock your course there.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            maxLength={6}
            dir="ltr"
            className="w-full text-center text-3xl font-bold tracking-[0.3em] uppercase bg-ink border border-border rounded-xl py-4 text-text placeholder:text-text-muted/40 focus:outline-none focus:border-gold transition-colors"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting || code.length !== 6}
            className="w-full justify-center mt-1"
          >
            {submitting ? "Connecting…" : "Connect TV"}
          </Button>
        </form>
      </div>
    </div>
  );
}
