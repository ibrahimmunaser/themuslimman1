"use client";

import Image from "next/image";
import { ArrowRight, Check, BookOpen, Brain, BarChart2 } from "lucide-react";
import type { InfluencerConfig } from "@/lib/influencer-configs";

const DEFAULT_SUPPORTING_COPY =
  "A structured 100-part course with videos, quizzes, flashcards, summaries, mind maps, and progress tracking.";

const BENEFITS = [
  { icon: BookOpen, text: "100 structured lessons — starting from the very beginning" },
  { icon: Brain,    text: "Videos, quizzes, flashcards, mind maps, and summaries" },
  { icon: BarChart2, text: "Progress tracking so you always know where you are" },
];

const LEARNING_FORMATS = ["Watch", "Read", "Slides", "Infographic", "Mind map", "Flashcards", "Quiz"];

interface OfferStepProps {
  config: InfluencerConfig;
  onContinue: () => void;
  onSkipToPlans: () => void;
}

export function OfferStep({
  config,
  onContinue,
  onSkipToPlans,
}: OfferStepProps) {
  const supportingCopy = config.supportingCopy ?? DEFAULT_SUPPORTING_COPY;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="flex-1 w-full max-w-lg mx-auto px-5 py-8 flex flex-col justify-center gap-6">

        {/* Creator recommendation badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold tracking-wide pl-1 pr-4 py-1">
            {config.avatarUrl && (
              <Image
                src={config.avatarUrl}
                alt={config.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-gold/30 flex-shrink-0"
              />
            )}
            <span>{config.badgeText}</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text leading-tight mb-3">
            {config.headline}
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed max-w-md mx-auto">
            {supportingCopy}
          </p>
        </div>

        {/* Optional hero image */}
        {config.landingImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50">
            <Image
              src={config.landingImageUrl}
              alt="Complete Seerah course preview"
              width={640}
              height={360}
              className="w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Benefit bullets */}
        <ul className="space-y-3" aria-label="Course benefits">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mt-0.5">
                <Icon className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
              </span>
              <span className="text-sm text-zinc-300 leading-snug">{text}</span>
            </li>
          ))}
        </ul>

        {/* Compact learning-format preview row */}
        <div className="flex flex-wrap justify-center gap-1.5" aria-label="Every lesson includes">
          {LEARNING_FORMATS.map((f) => (
            <span
              key={f}
              className="px-2.5 py-1 rounded-full bg-zinc-900/70 border border-zinc-800 text-[11px] font-medium text-zinc-400"
            >
              {f}
            </span>
          ))}
        </div>

        {/* ── CTA area ── */}
        <div className="space-y-2.5">
          {/* Primary CTA */}
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light active:scale-[0.98] text-ink font-bold text-base transition-all shadow-lg shadow-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[52px]"
            aria-label="Watch Part 1 free — no signup required"
          >
            Watch Part 1 Free
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <p className="text-center text-xs text-zinc-500">
            No signup required · Complete lesson preview
          </p>

          {/* Secondary path — intentionally understated so it never competes
              visually with the primary free-preview CTA. */}
          <div className="text-center pt-1">
            <button
              onClick={onSkipToPlans}
              className="text-xs text-zinc-500 hover:text-gold underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1 py-1 min-h-[32px]"
            >
              Already ready? View course plans
            </button>
          </div>
        </div>

        {/* Social proof footer */}
        <div className="pt-4 border-t border-zinc-800 flex flex-wrap justify-center gap-x-6 gap-y-1.5">
          {[
            "100 structured lessons",
            "Videos · quizzes · flashcards",
            "Trusted by Muslim learners worldwide",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Check className="w-3 h-3 text-zinc-700" aria-hidden="true" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
