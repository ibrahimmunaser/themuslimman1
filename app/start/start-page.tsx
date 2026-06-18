"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { track } from "@vercel/analytics";
import {
  Play, HelpCircle, Layers, TrendingUp, ChevronDown,
  Video, FileText, GitBranch, Users, List,
  BookOpen, BarChart2,
} from "lucide-react";

// ─── Routing ──────────────────────────────────────────────────────────────────
// Part 1 preview is 100% free, no login required, at /pricing#preview.
// View Plans goes to /pricing.
const PART1_URL  = "/pricing#preview";
const PRICING_URL = "/pricing";

function safeTrack(event: string) {
  try { track(event); } catch { /* analytics not critical */ }
}

// ─── CTA button ───────────────────────────────────────────────────────────────
function Part1Btn({ size = "md", className = "" }: { size?: "sm" | "md"; className?: string }) {
  return (
    <Link
      href={PART1_URL}
      onClick={() => safeTrack("start_part1_clicked")}
      className={`inline-flex items-center justify-center gap-2 bg-gold text-ink font-bold rounded-xl hover:bg-gold-light active:scale-95 transition-all shadow-lg shadow-gold/20 ${
        size === "sm" ? "text-sm px-5 py-2.5" : "text-base px-8 py-4"
      } ${className}`}
    >
      <Play className={size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"} />
      Start Part 1 Free
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function StartPage() {
  useEffect(() => {
    safeTrack("start_page_view");
  }, []);

  return (
    <div className="min-h-screen bg-ink text-text">

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
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
          <Part1Btn size="sm" />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold tracking-wide mb-8">
          <Play className="w-3 h-3 fill-current" />
          100 structured parts · Part 1 is free
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-text leading-tight tracking-tight mb-5">
          Learn the Life of the
          <br />
          <span className="text-gradient-gold">Prophet ﷺ in Order</span>
        </h1>

        <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          Most Muslims know scattered stories. This structured 100-part course helps you learn his full life step by step — with short videos, quizzes, flashcards, summaries, mind maps, and progress tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Part1Btn size="md" />
          <a
            href="#included"
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            See what&apos;s included <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="bg-surface border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                label: "Review with flashcards and summaries",
                desc: "Reinforce the key facts with flashcards, summaries, and mind maps.",
              },
              {
                icon: TrendingUp,
                label: "Track your progress step by step",
                desc: "See exactly where you are across all 100 parts.",
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

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-surface-raised border border-border rounded-2xl p-8 sm:p-10">
          <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-4">
            The gap
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-5">
            The problem is not memory. It is structure.
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
            Kids and adults can remember shows, games, athletes, and full storylines. But many Muslims never learn the life of the Prophet ﷺ from beginning to end — because there is no structured place to do it.
          </p>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base mt-4">
            The Muslim Man gives you the structure so you can finally learn it in order.
          </p>
        </div>
      </section>

      {/* ── What's included ─────────────────────────────────────────────────── */}
      <section id="included" className="bg-surface border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-10">
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

      {/* ── Mid-funnel CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-text mb-3">
          Start with Part 1 free
        </h2>
        <p className="text-text-secondary text-sm sm:text-base mb-8 max-w-md mx-auto">
          Begin with the first lesson and see how the course works before choosing a plan.
        </p>
        <Part1Btn size="md" />
        <p className="mt-4 text-xs text-text-muted">No credit card required · No signup to start</p>
      </section>

      {/* ── Pricing preview ─────────────────────────────────────────────────── */}
      <section className="bg-surface border-t border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-2">
            Continue the full course
          </h2>
          <p className="text-text-muted text-sm text-center mb-10">
            One-time payment available — no subscription required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { type: "Monthly",  audience: "Individual", price: "$4.99",  period: "/month",   featured: false },
              { type: "Monthly",  audience: "Family",     price: "$9.99",  period: "/month",   featured: false },
              { type: "Lifetime", audience: "Individual", price: "$49",    period: " one time", featured: true  },
              { type: "Lifetime", audience: "Family",     price: "$99",    period: " one time", featured: true  },
            ].map((plan) => (
              <div
                key={plan.audience + plan.type}
                className={`rounded-2xl border p-5 ${
                  plan.featured
                    ? "border-gold/40 bg-gold-bg"
                    : "border-border bg-surface-raised"
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

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-12 text-center border-t border-border/40">
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
  );
}
