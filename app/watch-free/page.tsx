import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

export const metadata: Metadata = {
  title: "Watch Part 1 Free | The Muslim Man",
  description:
    "No card needed. Watch the first lesson of the structured 100-part Seerah course — short video, quiz, flashcards, and summaries. Free, no signup required.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function WatchFreePage() {
  return (
    <div className="min-h-screen bg-ink text-text">

      {/* ── Minimal nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logoicon.png"
              alt="The Muslim Man"
              width={967}
              height={219}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-text-secondary hover:text-text transition-colors"
          >
            View Plans →
          </Link>
        </div>
      </header>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold tracking-wide mb-6">
          <Play className="w-3 h-3 fill-current" />
          100% Free · No Signup Required
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-text leading-tight tracking-tight mb-4">
          Watch Part 1 Free
        </h1>
        <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          No card needed. Start learning the life of the Prophet ﷺ in order.
        </p>
      </section>

      {/* ── Part 1 Preview ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden p-10 text-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary text-sm">Loading Part 1…</p>
            </div>
          }
        >
          <Part1FullPreview hideCta />
        </Suspense>
      </section>

      {/* ── Continuation CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface/50 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-7 max-w-lg mx-auto">
            Continue the full structured course with videos, quizzes, flashcards, summaries, mind maps, and progress tracking.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-gold text-ink font-bold px-8 py-4 rounded-xl hover:bg-gold-light active:scale-[0.97] transition-all shadow-lg shadow-gold/20"
          >
            View Plans
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-xs text-text-muted">
            From $4.99/month · Cancel anytime · 7-day guarantee
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-ink py-8 text-center border-t border-border/40">
        <p className="text-text-muted text-xs">
          © {new Date().getFullYear()} TheMuslimMan · Complete Seerah
        </p>
        <div className="flex items-center justify-center gap-6 mt-2">
          <Link href="/pricing" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Plans</Link>
          <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Home</Link>
          <Link href="/login" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
