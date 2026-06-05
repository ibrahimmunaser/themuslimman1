import Link from "next/link";
import Image from "next/image";
import {
  Play, CheckCircle, Star, Users, BookOpen, Brain,
  Layers, FileText, Map, ClipboardCheck, Headphones,
  ChevronRight, ArrowRight, Zap, Lock, Unlock, Trophy,
  Video, Camera, ListChecks,
} from "lucide-react";

export const metadata = {
  title: "See Inside the Course — TheMuslimMan",
  description:
    "A complete step-by-step Seerah learning platform for Muslim families. 100 videos, quizzes, flashcards, mind maps, and more.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ clean?: string }>;
}

export default async function CreatorDemoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clean = params.clean === "true" || params.clean === "1";

  return (
    <div className="bg-ink text-text font-sans overflow-x-hidden">

      {/* ── Top Nav (hidden in clean mode) ──────────────────────────────── */}
      {!clean && (
        <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b border-border/40 px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logoicon.png"
              alt="TheMuslimMan"
              width={967}
              height={219}
              sizes="120px"
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs text-text-muted hover:text-gold transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/checkout?billing=lifetime"
              className="text-xs bg-gold text-ink font-bold px-3 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
            >
              Get Access
            </Link>
          </div>
        </header>
      )}

      {/* ── Clean-mode banner ───────────────────────────────────────────── */}
      {clean && (
        <div className="bg-gold/10 border-b border-gold/20 px-4 py-2 text-center">
          <p className="text-[11px] text-gold/80 font-medium">
            📱 Creator Demo Mode — optimized for screen recording
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100svh-56px)] flex flex-col items-center justify-center px-5 py-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-gold/5 blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-gold/4 blur-[60px]" />
        </div>

        <div className="relative z-10 max-w-sm mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 text-gold text-xs font-semibold px-4 py-2 rounded-full">
            <Star className="w-3.5 h-3.5 fill-gold" />
            100-Part Seerah Series
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-[1.1] tracking-tight">
            Learn the Seerah{" "}
            <span className="text-gold">in Order</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base text-text-secondary leading-relaxed">
            A complete step-by-step Seerah learning platform for Muslim
            families — structured, visual, and sequential.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {["Videos", "Presentations", "Quizzes", "Flashcards", "Mind Maps", "Summaries"].map((f) => (
              <span
                key={f}
                className="text-[11px] font-medium bg-surface border border-border/60 text-text-muted px-2.5 py-1 rounded-full"
              >
                {f}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-ink font-bold text-base px-6 py-4 rounded-xl transition-colors shadow-lg shadow-gold/20"
            >
              Start Learning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#preview"
              className="flex items-center justify-center gap-2 border border-border/60 text-text-muted hover:text-text text-sm px-6 py-3.5 rounded-xl transition-colors"
            >
              <Play className="w-4 h-4" />
              Preview Part 1 Free
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-xs text-text-muted/70 pt-2">
            From $9/month · Lifetime access available · 7-Day Guarantee
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — PART 1 PREVIEW CARD
      ══════════════════════════════════════════════════════════════════ */}
      <section id="preview" className="px-5 py-14 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">Free Preview</span>
          <h2 className="text-2xl font-bold text-text mt-2">Start with Part 1 — Free</h2>
          <p className="text-sm text-text-secondary mt-2">
            No account needed. Watch the full first lesson before paying anything.
          </p>
        </div>

        {/* Part card */}
        <div className="bg-surface border border-border/60 rounded-2xl overflow-hidden shadow-xl">
          {/* Card header */}
          <div className="bg-gradient-to-br from-gold/15 via-gold/8 to-transparent px-5 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gold/15 border border-gold/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-gold font-extrabold text-sm">1</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gold/80 uppercase tracking-wider mb-0.5">
                  Part 1 of 100
                </p>
                <h3 className="text-base font-bold text-text leading-snug">
                  The Pre-Islamic Arabian Context
                </h3>
                <p className="text-xs text-text-muted mt-1">Setting the Stage</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-sm text-text-secondary leading-relaxed">
              An overview of the Arabian Peninsula — its geography, peoples, and
              the conditions that made it the soil into which the final revelation
              would be planted.
            </p>
          </div>

          {/* Learning tools */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
              What&apos;s Inside
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Video,          label: "Video Lesson"      },
                { icon: FileText,       label: "Briefing Notes"    },
                { icon: Layers,         label: "Presentation Deck" },
                { icon: Map,            label: "Mind Map"          },
                { icon: ClipboardCheck, label: "Quiz (80% to pass)"},
                { icon: Brain,          label: "Flashcards"        },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
                  <Icon className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 py-4">
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-gold hover:bg-gold-light text-ink font-bold text-sm px-4 py-3.5 rounded-xl transition-colors"
            >
              <Play className="w-4 h-4" />
              Watch Part 1 Free
            </Link>
            <p className="text-center text-[11px] text-text-muted/60 mt-2">
              No signup required to preview
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — FEATURE SHOWCASE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">What You Get</span>
          <h2 className="text-2xl font-bold text-text mt-2">
            Every Part. Every Format.
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Each of the 100 parts includes a full learning toolkit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Video,          num: "100",  label: "Video Lessons",       desc: "Follow the Seerah step by step" },
            { icon: Layers,         num: "300+", label: "Presentations",        desc: "Visual slides per lesson"       },
            { icon: Camera,         num: "300+", label: "Infographics",         desc: "Visual explanations"            },
            { icon: ClipboardCheck, num: "100",  label: "Quizzes",              desc: "Test your retention"            },
            { icon: Brain,          num: "100",  label: "Flashcard Decks",      desc: "Active recall every part"       },
            { icon: Map,            num: "100",  label: "Mind Maps",            desc: "See connections clearly"        },
            { icon: FileText,       num: "100",  label: "Briefing Documents",   desc: "Written summaries"              },
            { icon: Users,          num: "5",    label: "Family Profiles",      desc: "Each member tracks progress"    },
          ].map(({ icon: Icon, num, label, desc }) => (
            <div
              key={label}
              className="bg-surface border border-border/50 rounded-2xl p-4 flex flex-col gap-2"
            >
              <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-text leading-none">{num}</p>
                <p className="text-xs font-bold text-text mt-0.5">{label}</p>
                <p className="text-[11px] text-text-muted leading-snug mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — LEARNING FLOW
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">How It Works</span>
          <h2 className="text-2xl font-bold text-text mt-2">
            One Part at a Time
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Sequential learning with real accountability built in.
          </p>
        </div>

        <div className="relative space-y-3">
          {/* Vertical connector line */}
          <div className="absolute left-6 top-10 bottom-10 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" aria-hidden />

          {[
            {
              step: 1,
              icon: Play,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              title: "Watch the Video",
              desc: "20–40 minute focused lesson per part",
            },
            {
              step: 2,
              icon: FileText,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
              title: "Review the Materials",
              desc: "Briefings, slides, mind maps, flashcards",
            },
            {
              step: 3,
              icon: ClipboardCheck,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              title: "Take the Quiz",
              desc: "Pass with 80%+ to unlock the next part",
            },
            {
              step: 4,
              icon: Unlock,
              color: "text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
              title: "Unlock Part 2",
              desc: "Progress is saved and tracked automatically",
            },
            {
              step: 5,
              icon: Trophy,
              color: "text-gold",
              bg: "bg-gold/10 border-gold/25",
              title: "Complete the Full Seerah",
              desc: "100 parts — the full life of the Prophet ﷺ",
            },
          ].map(({ step, icon: Icon, color, bg, title, desc }) => (
            <div key={step} className="flex items-start gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 bg-surface border border-border/40 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Step {step}
                  </span>
                </div>
                <p className="font-bold text-sm text-text mt-0.5">{title}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual unlock indicator */}
        <div className="mt-8 bg-gradient-to-r from-green-500/10 to-gold/10 border border-green-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-text">Pass with 80% → Unlock the next part</p>
            <p className="text-xs text-text-muted mt-0.5">No shortcuts. Real knowledge, in order.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — FAMILY / PARENT SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14 max-w-sm mx-auto">
        <div className="bg-gradient-to-b from-surface-raised to-surface border border-border/50 rounded-3xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />

          <div className="px-6 py-8 text-center space-y-5">
            <div className="w-14 h-14 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-gold" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-text leading-tight">
                Built for Muslim Families Who Want Structure
              </h2>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                Instead of random clips and scattered reminders, families can
                learn the life of the Prophet ﷺ step by step — in order,
                together.
              </p>
            </div>

            <div className="space-y-3 text-left">
              {[
                "Up to 5 learner profiles per family",
                "Each member tracks their own progress",
                "Kids, teens, and parents all learning together",
                "One lifetime payment for the whole family",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">{item}</p>
                </div>
              ))}
            </div>

            <Link
              href="/checkout?plan=family&billing=lifetime"
              className="flex items-center justify-center gap-2 w-full bg-surface border border-gold/40 text-gold font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-gold/10 transition-colors"
            >
              <Users className="w-4 h-4" />
              See Family Plan
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — PRICING PREVIEW
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">Pricing</span>
          <h2 className="text-2xl font-bold text-text mt-2">Simple, Honest Pricing</h2>
          <p className="text-sm text-text-secondary mt-2">
            Start with Part 1 free — no credit card required.
          </p>
        </div>

        <div className="space-y-4">
          {/* Individual Monthly */}
          <div className="bg-surface border border-border/50 rounded-2xl px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Individual</p>
                <p className="text-lg font-extrabold text-text mt-0.5">$9 / month</p>
              </div>
              <span className="text-[11px] bg-surface-raised border border-border/50 text-text-muted px-2.5 py-1 rounded-full font-medium">Monthly</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">Full access for one learner. Cancel anytime.</p>
          </div>

          {/* Individual Lifetime - Highlighted */}
          <div className="bg-gradient-to-br from-gold/12 via-gold/6 to-transparent border-2 border-gold/40 rounded-2xl px-5 py-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] bg-gold text-ink font-extrabold px-2.5 py-1 rounded-full">BEST VALUE</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-gold/80 uppercase tracking-wider">Individual</p>
                <p className="text-2xl font-extrabold text-text mt-0.5">$99 <span className="text-sm font-normal text-text-muted">once</span></p>
              </div>
              <span className="text-[11px] bg-gold/15 border border-gold/30 text-gold px-2.5 py-1 rounded-full font-bold">Lifetime</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">Pay once. Keep access forever. All 100 parts. 7-day guarantee.</p>
            <Link
              href="/checkout?plan=individual&billing=lifetime"
              className="flex items-center justify-center gap-2 w-full mt-4 bg-gold hover:bg-gold-light text-ink font-bold text-sm px-5 py-3.5 rounded-xl transition-colors"
            >
              Get Lifetime Access — $99
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Family Lifetime */}
          <div className="bg-surface border border-border/50 rounded-2xl px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Family</p>
                <p className="text-xl font-extrabold text-text mt-0.5">$199 <span className="text-sm font-normal text-text-muted">once</span></p>
              </div>
              <span className="text-[11px] bg-surface-raised border border-border/50 text-text-muted px-2.5 py-1 rounded-full font-medium">5 Profiles</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">Up to 5 learner profiles. One payment for the whole family, forever.</p>
            <Link
              href="/checkout?plan=family&billing=lifetime"
              className="flex items-center justify-center gap-2 w-full mt-4 bg-surface-raised border border-border/60 text-text text-sm font-semibold px-5 py-3 rounded-xl hover:border-gold/40 transition-colors"
            >
              Get Family Access — $199
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>
          </div>
        </div>

        {/* Promo code area */}
        <div className="mt-6 bg-gold/5 border border-gold/20 rounded-2xl px-5 py-4 text-center">
          <p className="text-xs font-bold text-gold mb-1">Have a promo code?</p>
          <p className="text-[11px] text-text-muted">
            Enter it at checkout to apply your exclusive discount.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — INFLUENCER CHECKLIST (hidden in clean mode)
      ══════════════════════════════════════════════════════════════════ */}
      {!clean && (
        <section className="px-5 py-12 max-w-sm mx-auto">
          <div className="bg-surface-raised border border-border/50 rounded-2xl px-5 py-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gold/10 border border-gold/25 rounded-xl flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-bold text-sm text-text">Creator Recording Checklist</p>
                <p className="text-[11px] text-text-muted">What to capture for your Reel / Short</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                "1. Hero section — headline and CTA",
                "2. Part 1 free preview card",
                "3. Feature cards — show all 8",
                "4. Watch → Quiz → Unlock flow",
                "5. Family learning section",
                "6. Pricing — highlight best value",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                  <div className="w-4 h-4 border border-gold/40 rounded flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border/40">
              <p className="text-[11px] text-text-muted text-center">
                Add{" "}
                <span className="text-gold font-bold">?clean=true</span>
                {" "}to the URL to hide this checklist and navigation during recording.
              </p>
              <div className="mt-2 bg-surface border border-border/50 rounded-lg px-3 py-2">
                <p className="text-[11px] font-mono text-gold/80 text-center break-all">
                  themuslimman.com/creator-demo?clean=true
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="px-5 py-14 max-w-sm mx-auto text-center">
        <div className="relative overflow-hidden bg-gradient-to-b from-gold/10 to-surface border border-gold/25 rounded-3xl px-6 py-10">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-gold/8 blur-[50px]" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="text-4xl">🕌</div>
            <h2 className="text-2xl font-extrabold text-text">
              Ready to Learn the Seerah Properly?
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Start with Part 1 completely free. No account needed to preview.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-ink font-bold text-base px-6 py-4 rounded-xl transition-colors shadow-lg shadow-gold/20"
              >
                <Zap className="w-4 h-4" />
                Start Free — Part 1
              </Link>
              <Link
                href="/checkout?billing=lifetime"
                className="text-sm text-text-muted hover:text-gold transition-colors py-2"
              >
                Or get full lifetime access →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer (hidden in clean mode) ───────────────────────────────── */}
      {!clean && (
        <footer className="border-t border-border/40 px-5 py-8 text-center">
          <Image
            src="/images/logoicon.png"
            alt="TheMuslimMan"
            width={967}
            height={219}
            sizes="100px"
            className="h-7 w-auto mx-auto mb-4 opacity-60"
          />
          <p className="text-xs text-text-muted/60">
            © 2026 TheMuslimMan. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/pricing" className="text-xs text-text-muted/50 hover:text-gold transition-colors">Pricing</Link>
            <Link href="/help" className="text-xs text-text-muted/50 hover:text-gold transition-colors">Help</Link>
            <Link href="/privacy" className="text-xs text-text-muted/50 hover:text-gold transition-colors">Privacy</Link>
          </div>
        </footer>
      )}

    </div>
  );
}
