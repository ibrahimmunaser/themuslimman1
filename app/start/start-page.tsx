"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { track } from "@vercel/analytics";
import {
  Play, HelpCircle, Layers, TrendingUp, ChevronDown,
  Video, FileText, GitBranch, Users, List,
  BookOpen, BarChart2, Clock,
} from "lucide-react";

const PART1_URL  = "/pricing#preview";
const PRICING_URL = "/pricing";

function safeTrack(event: string) {
  try { track(event); } catch { /* non-critical */ }
}

// ─── Reusable CTA button ──────────────────────────────────────────────────────
function Part1Btn({
  size = "md",
  label = "Start Part 1 Free",
  className = "",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const sizeClasses = {
    xs: "text-xs px-4 py-2 gap-1.5",
    sm: "text-sm px-5 py-2.5 gap-2",
    md: "text-base px-8 py-4 gap-2",
    lg: "text-lg px-9 py-5 gap-2.5",
  }[size];

  const iconSize = size === "xs" || size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-5 h-5";

  return (
    <Link
      href={PART1_URL}
      onClick={() => safeTrack("start_part1_clicked")}
      className={`inline-flex items-center justify-center bg-gold text-ink font-bold rounded-xl hover:bg-gold-light active:scale-[0.97] transition-all shadow-lg shadow-gold/20 ${sizeClasses} ${className}`}
    >
      <Play className={`${iconSize} fill-current`} />
      {label}
    </Link>
  );
}

// ─── Sticky bottom bar ────────────────────────────────────────────────────────
function StickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border shadow-2xl shadow-black/50 md:hidden">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: simple label */}
        <p className="text-sm font-semibold text-text whitespace-nowrap">
          <span className="text-gold">Part 1</span> is free
        </p>

        {/* Right: CTA — shorter label on small screens */}
        <Link
          href={PART1_URL}
          onClick={() => safeTrack("start_part1_clicked")}
          className="inline-flex items-center gap-1.5 bg-gold text-ink font-bold rounded-xl text-sm px-5 py-2.5 hover:bg-gold-light active:scale-[0.97] transition-all shadow shadow-gold/20 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Start Part 1 Free</span>
          <span className="sm:hidden">Start Free</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function StartPage({ preview }: { preview?: ReactNode }) {
  useEffect(() => {
    safeTrack("start_page_view");
  }, []);

  return (
    <>
      <div className="min-h-screen bg-ink text-text pb-14">

        {/* ── Top nav ───────────────────────────────────────────────────────── */}
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
            {/* Desktop: full label; mobile: short label */}
            <Part1Btn size="sm" label="Start Part 1 Free" className="hidden sm:inline-flex" />
            <Part1Btn size="xs" label="Start Free" className="sm:hidden" />
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 pb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold tracking-wide mb-7">
            <Clock className="w-3 h-3" />
            100 structured parts · Part 1 is free · No card needed
          </div>

          {/* Headline — big, punchy, emotional */}
          <h1 className="text-[2.4rem] sm:text-6xl font-extrabold text-text leading-[1.1] tracking-tight mb-5">
            Most Muslims Know Stories…
            <br />
            <span className="text-gradient-gold">
              But Not the Prophet&apos;s Life in Order
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-text-secondary text-base sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Start a structured 100-part course that teaches the life of the Prophet ﷺ step by step with short videos, quizzes, flashcards, summaries, mind maps, and progress tracking.
          </p>

          {/* Primary CTA + trust line */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <Part1Btn size="lg" />
            <p className="text-xs text-text-muted">
              No card needed. Start in under 30 seconds.
            </p>
          </div>

          {/* Secondary link */}
          <a
            href="#included"
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            See what&apos;s included <ChevronDown className="w-3 h-3" />
          </a>
        </section>

        {/* ── Real Part 1 preview ───────────────────────────────────────────── */}
        {preview && (
          <section className="max-w-5xl mx-auto px-4 pb-16">
            <p className="text-xs font-semibold text-gold uppercase tracking-widest text-center mb-4">
              This is what Part 1 looks like
            </p>
            {preview}
          </section>
        )}

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="bg-surface border-y border-border py-14">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-8">
              How it works
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  icon: Video,
                  label: "Watch a short lesson",
                  desc: "Each part covers one focused period of the Prophet's ﷺ life.",
                },
                {
                  icon: HelpCircle,
                  label: "Take the quiz",
                  desc: "Test what you retained with a short quiz after each lesson.",
                },
                {
                  icon: Layers,
                  label: "Review flashcards and summaries",
                  desc: "Reinforce key facts with flashcards, summaries, and mind maps.",
                },
                {
                  icon: TrendingUp,
                  label: "Track your progress",
                  desc: "See exactly where you are across all 100 parts at a glance.",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="bg-surface-raised border border-border rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-sm font-semibold text-text leading-snug">{label}</p>
                  <p className="text-xs text-text-muted leading-relaxed hidden md:block">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Problem ───────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-14">
          <div className="bg-surface-raised border border-border rounded-2xl p-7 sm:p-10">
            <p className="text-xs font-semibold text-gold uppercase tracking-widest mb-4">
              The gap
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-5">
              The problem is not memory. It is structure.
            </h2>
            <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
              Kids and adults can remember shows, games, athletes, and full storylines. But many Muslims cannot explain the life of the Prophet ﷺ from beginning to end. This course gives you a simple path to learn it in order.
            </p>
          </div>
        </section>

        {/* ── What's included ───────────────────────────────────────────────── */}
        <section id="included" className="bg-surface border-y border-border py-14">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-8">
              Everything organized in one place
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: List,       label: "100 structured lessons" },
                { icon: Play,       label: "Short videos" },
                { icon: HelpCircle, label: "Quizzes" },
                { icon: Layers,     label: "Flashcards" },
                { icon: FileText,   label: "Summaries" },
                { icon: GitBranch,  label: "Mind maps" },
                { icon: BookOpen,   label: "Presentations" },
                { icon: BarChart2,  label: "Progress tracking" },
                { icon: Users,      label: "Family profiles" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-surface-raised border border-border rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-sm font-medium text-text">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Pricing preview ───────────────────────────────────────────────── */}
        <section className="bg-ink border-t border-border py-14">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-2">
              Continue the full course
            </h2>
            <p className="text-text-muted text-sm text-center mb-10">
              One-time payment available — no subscription required.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { type: "Monthly",  audience: "Individual", price: "$4.99", period: "/month",    featured: false },
                { type: "Monthly",  audience: "Family",     price: "$9.99", period: "/month",    featured: false },
                { type: "Lifetime", audience: "Individual", price: "$49",   period: " one time", featured: true  },
                { type: "Lifetime", audience: "Family",     price: "$99",   period: " one time", featured: true  },
              ].map((plan) => (
                <div
                  key={plan.audience + plan.type}
                  className={`rounded-2xl border p-5 ${
                    plan.featured
                      ? "border-gold/40 bg-gold-bg"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">{plan.type}</p>
                      <p className="font-semibold text-text">{plan.audience}</p>
                    </div>
                    {plan.featured && (
                      <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                        One time
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-text">
                    {plan.price}
                    <span className="text-sm font-normal text-text-muted">{plan.period}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href={PRICING_URL}
                onClick={() => safeTrack("start_pricing_clicked")}
                className="inline-flex items-center gap-2 border border-gold/40 text-gold font-semibold px-8 py-3.5 rounded-xl hover:bg-gold/10 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="bg-ink py-10 text-center border-t border-border/40">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logoicon.png"
              alt="The Muslim Man"
              width={967}
              height={219}
              className="h-8 w-auto opacity-50 hover:opacity-80 transition-opacity mx-auto"
            />
          </Link>
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} TheMuslimMan · Complete Seerah
          </p>
          <div className="flex items-center justify-center gap-6 mt-3">
            <Link href="/pricing" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Plans</Link>
            <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Home</Link>
            <Link href="/login" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Sign in</Link>
          </div>
        </footer>

      </div>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────────── */}
      <StickyBar />
    </>
  );
}
