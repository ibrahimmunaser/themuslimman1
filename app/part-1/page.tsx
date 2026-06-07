import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { ArrowRight, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Preview — Part 1 | Complete Seerah",
  description:
    "Try Part 1 of the Complete Seerah course free — video, reading, slides, flashcards, and quiz on the Pre-Islamic Arabian context.",
};

export default function Part1PreviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border/60 bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
            Free Preview
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
            Part 1 — Pre-Islamic Arabia
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed mb-6">
            This is the first lesson of the Complete Seerah course, unlocked for
            everyone. Explore every learning mode below — video, reading,
            slides, flashcards, and quiz.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-gold hover:bg-gold-light text-ink text-sm font-semibold rounded-lg transition-colors"
            >
              Get Full Access
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border border-border hover:border-gold/40 text-text-secondary hover:text-text text-sm rounded-lg transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Part 1 preview — same component used on the landing page */}
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="flex gap-2 px-4 pt-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-8 w-20 bg-surface-raised rounded-lg" />
                  ))}
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-surface-raised rounded w-2/3" />
                  <div className="h-4 bg-surface-raised rounded w-1/2" />
                  <div className="mt-6 aspect-video bg-surface-raised rounded-xl" />
                </div>
              </div>
            </div>
          }
        >
          <Part1FullPreview />
        </Suspense>
      </div>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
            <Lock className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-medium text-gold">Parts 2–100 are locked</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            Continue the Full Seerah
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
            Unlock all 100 parts — video lessons, briefings, slides,
            infographics, mind maps, flashcards, quizzes, and audio — in one
            structured lifetime course.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light text-ink font-semibold rounded-lg transition-colors shadow-lg shadow-gold/20"
            >
              Get Lifetime Access — $99
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-gold/40 text-text-secondary hover:text-text rounded-lg transition-colors"
            >
              See All Plans
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            One-time payment · Instant access · 7-Day Clarity Guarantee
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
