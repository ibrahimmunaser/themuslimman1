import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Play, BarChart2, Clock, Zap } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — The Orthodox Muslim",
  description:
    "Do you know the Prophet's ﷺ life in order — or only scattered stories? Take the free 2-minute Seerah Checkup and find out.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_checkup&utm_content=theorthodoxmuslim";
const INDIVIDUAL_MONTHLY_URL = `/checkout?plan=individual-monthly&source=theorthodoxmuslim&${UTM}`;

const FAQ = [
  { q: "Is the checkup free?", a: "Yes. Completely free. No payment, no card, no signup required to take the checkup." },
  { q: "How long does it take?", a: "About 2 minutes. There are 15 short questions." },
  { q: "Do I need to pay to see my result?", a: "No. Your score and result are shown instantly and for free after the last question." },
  { q: "What happens after I get my result?", a: "You'll see a personalised recommended next step. If you're ready, you can start full access. If not, Part 1 is completely free." },
  { q: "Is Part 1 free?", a: "Yes. Part 1 is completely free — full video, reading, slides, flashcards, and quiz. No signup or payment required." },
  { q: "Can I use this with my family?", a: "Yes. The family plan includes up to 5 separate learner profiles, each tracking their own progress independently." },
];

export default async function TheOrthodoxMuslimPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "theorthodoxmuslim" } })
    .catch(() => {});

  return (
    <>
      <div className="flex flex-col min-h-screen bg-ink text-text">

        {/* ── Header ── */}
        <header className="py-4 px-4 sm:px-6 border-b border-border/30 bg-ink sticky top-0 z-40">
          <div className="max-w-5xl mx-auto flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logoicon.png"
                alt="The Muslim Man"
                width={967}
                height={219}
                className="h-9 sm:h-10 w-auto"
                priority
              />
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative pt-16 pb-14 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(200,169,110,0.12) 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">

            {/* Attribution */}
            <div className="mb-6">
              <p className="text-base font-bold text-gold">As seen on The Orthodox Muslim</p>
              <p className="text-sm text-text-muted mt-0.5">Exclusive community offer</p>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.06] mb-5">
              Do You Know the Prophet&apos;s ﷺ Life in Order —{" "}
              <span className="text-gradient-gold">or Only Scattered Stories?</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              Take the free 2-minute Seerah Checkup and see where your understanding is strong, where it is scattered, and what to study next.
            </p>

            {/* Primary CTA */}
            <Link
              href="/theorthodoxmuslim/checkup"
              data-track="orthodox_checkup_start_click"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-12 py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25"
            >
              <BarChart2 className="w-5 h-5" />
              Take the Free Seerah Checkup
            </Link>
            <p className="text-xs text-text-muted/70 mt-3 mb-6">
              2 minutes · Free · Instant result
            </p>

            {/* Secondary CTA */}
            <p className="text-sm text-text-muted">
              Or{" "}
              <a
                href="#preview"
                data-track="orthodox_hero_watch_free_click"
                className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors font-semibold"
              >
                <Play className="inline w-3.5 h-3.5 mr-1" />
                Watch Part 1 Free
              </a>
              {" "}without the checkup.
            </p>
          </div>
        </section>

        {/* ── Value proposition: 3 areas ── */}
        <section className="py-12 sm:py-16 bg-surface/20 border-y border-border/50">
          <div className="max-w-3xl mx-auto px-6 sm:px-8">
            <p className="text-center text-sm font-semibold text-text-muted uppercase tracking-widest mb-8">
              This checkup measures 3 areas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  number: "1",
                  title: "Timeline",
                  desc: "Do you know the major events in order?",
                },
                {
                  number: "2",
                  title: "Connection",
                  desc: "Do you understand how the events connect?",
                },
                {
                  number: "3",
                  title: "Consistency",
                  desc: "Do you have a simple path to keep learning?",
                },
              ].map(({ number, title, desc }) => (
                <div key={title} className="p-5 rounded-2xl border border-border bg-surface text-center">
                  <p className="text-3xl font-extrabold text-gold mb-2">{number}</p>
                  <p className="text-base font-bold text-text mb-1">{title}</p>
                  <p className="text-sm text-text-secondary">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Result preview (static mockup) ── */}
        <section className="py-14 sm:py-20">
          <div className="max-w-lg mx-auto px-6 sm:px-8">
            <p className="text-center text-sm font-semibold text-text-muted uppercase tracking-widest mb-8">
              Your result will look like this
            </p>

            {/* Mock result card */}
            <div className="rounded-2xl border-2 border-gold/30 bg-surface p-6 mb-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 text-center">Seerah Clarity Score</p>
              <p className="text-7xl font-extrabold text-gold text-center leading-none mb-2">
                64<span className="text-3xl text-gold/60 font-bold">%</span>
              </p>
              <p className="text-lg font-bold text-gold text-center mb-4">Partial Clarity</p>

              <div className="space-y-2.5 mb-5">
                {[
                  { label: "Timeline", status: "Needs structure", weak: true },
                  { label: "Connection", status: "Getting clearer", weak: false },
                  { label: "Consistency", status: "Needs a system", weak: true },
                ].map(({ label, status, weak }) => (
                  <div key={label} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${weak ? "border-amber-500/25 bg-amber-500/5" : "border-emerald-500/25 bg-emerald-500/5"}`}>
                    <span className="text-sm font-medium text-text">{label}</span>
                    <span className={`text-xs font-semibold ${weak ? "text-amber-400" : "text-emerald-400"}`}>{status}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-gold/8 border border-gold/20">
                <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Recommended next step</p>
                <p className="text-sm text-text font-semibold">Individual Access — $4.99/month</p>
                <p className="text-xs text-text-muted mt-0.5">Based on your answers</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/theorthodoxmuslim/checkup"
              data-track="orthodox_checkup_start_click"
              className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
            >
              Get Your Real Score →
            </Link>
            <p className="text-xs text-center text-text-muted/60 mt-2">Free · No payment required</p>
          </div>
        </section>

        {/* ── Credibility ── */}
        <section className="py-10 bg-surface/20 border-y border-border/50">
          <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold/60" />
                As seen on The Orthodox Muslim
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold/60" />
                Built from reliable Islamic source material
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold/60" />
                Structured for serious learning
              </span>
            </div>
          </div>
        </section>

        {/* ── Part 1 preview anchor ── */}
        <section id="preview" className="py-14 sm:py-20 scroll-mt-16">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-4">Not ready for the checkup?</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Watch Part 1 Free First</h2>
            <p className="text-lg text-text-secondary mb-8">
              Full first lesson — video, reading, slides, flashcards, and quiz. No signup, no payment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/watch-free"
                data-track="orthodox_hero_watch_free_click"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Part 1 Free
              </Link>
              <Link
                href={INDIVIDUAL_MONTHLY_URL}
                data-track="orthodox_hero_start_monthly_click"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-gold/50 text-gold font-bold text-base hover:border-gold hover:bg-gold/5 transition-colors"
              >
                Start Full Access — $4.99/month
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-4">
              No signup required · Cancel anytime · 7-day refund guarantee
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-14 sm:py-20 bg-surface/20 border-t border-border/50">
          <div className="max-w-2xl mx-auto px-6 sm:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">Quick Questions</h2>
            <div className="space-y-3">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="p-5 rounded-xl bg-surface border border-border">
                  <p className="font-semibold text-text text-base mb-1.5">{q}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-16 sm:py-24">
          <div className="max-w-xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Find Out Where You Stand
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Take the free 2-minute Seerah Checkup and get a personalised score and next step.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/theorthodoxmuslim/checkup"
                data-track="orthodox_checkup_start_click"
                className="inline-flex items-center justify-center gap-2 w-full py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25"
              >
                <BarChart2 className="w-5 h-5" />
                Take the Free Seerah Checkup
              </Link>
              <a
                href="#preview"
                data-track="orthodox_hero_watch_free_click"
                className="w-full py-4 rounded-xl border-2 border-gold/40 text-gold font-bold text-base text-center hover:border-gold/70 hover:bg-gold/5 transition-colors"
              >
                Watch Part 1 Free
              </a>
            </div>
            <p className="text-sm text-text-muted mt-4">
              Secure checkout · Instant access · Cancel anytime · 7-day refund guarantee
            </p>
          </div>
        </section>

        <div className="pb-20 sm:pb-0">
          <Footer />
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-3 py-2.5 flex gap-2">
        <a
          href="#preview"
          data-track="orthodox_sticky_watch_free_click"
          className="flex-1 flex items-center justify-center py-3 rounded-xl border border-gold/40 text-gold font-bold text-sm transition-colors hover:bg-gold/5"
        >
          Watch Free
        </a>
        <Link
          href="/theorthodoxmuslim/checkup"
          data-track="orthodox_sticky_checkup_click"
          className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
        >
          Seerah Checkup
        </Link>
      </div>
    </>
  );
}
