"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight, BookOpen, Brain, BarChart2, Check, ChevronDown, Infinity, ShieldCheck,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import type { InfluencerConfig } from "@/lib/influencer-configs";
import type { Part } from "@/lib/types";
import type { Part1AssetUrls } from "@/lib/part1-preview-data";
import type { CourseLang } from "@/lib/course-lang";
import { Part1PreviewTabs } from "@/components/landing/part1-preview-tabs";

const FEATURES = [
  { icon: BookOpen,  text: "100 structured lessons — starting from the beginning" },
  { icon: Brain,     text: "Videos, quizzes, flashcards, mind maps, and summaries" },
  { icon: BarChart2, text: "Progress tracking so you always know where you are" },
];

const FAQ_ITEMS = [
  {
    q: "What is included?",
    a: "Full access to all 100 Seerah lessons with video, reading, quizzes, flashcards, summaries, mind maps, and progress tracking.",
  },
  {
    q: "Is Part 1 free?",
    a: "Yes. Part 1 is free with no signup required — preview it on this page before you buy.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly plans can be canceled anytime from your billing page. Lifetime is a one-time payment with no renewal.",
  },
  {
    q: "Is there a refund guarantee?",
    a: "Yes. If the course is not what you expected, contact us within 7 days for a full refund.",
  },
  {
    q: "Do I get instant access?",
    a: "Yes. After checkout you get immediate access to the full course on any device.",
  },
];

interface InfluencerSalesPageProps {
  config: InfluencerConfig;
  part1: Part | null;
  part1AssetUrls: Part1AssetUrls;
  initialLang?: CourseLang;
  onCheckout: (plan: "lifetime" | "monthly") => void;
}

export function InfluencerSalesPage({
  config,
  part1,
  part1AssetUrls,
  initialLang = "en",
  onCheckout,
}: InfluencerSalesPageProps) {
  const searchParams = useSearchParams();
  const lessonRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const [showMonthly, setShowMonthly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const prevModeRef = useRef<string | null>(null);

  const supportingCopy =
    config.supportingCopy ??
    "A structured 100-part course with videos, quizzes, flashcards, summaries, mind maps, and progress tracking.";

  const lifetimePrice = formatPrice(PLANS.complete.price);
  const monthlyPrice = formatPrice(PLANS.monthly.price);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam && modeParam !== prevModeRef.current) {
      if (prevModeRef.current !== null) {
        trackEvent(
          "part_1_content_tab_selected",
          { influencer_slug: config.slug, tab: modeParam },
          { allowDuplicates: true, creator: config.slug },
        );
      }
      prevModeRef.current = modeParam;
    }
  }, [searchParams, config.slug]);

  useEffect(() => {
    const handler = () => {
      trackEvent(
        "part_1_video_started",
        { influencer_slug: config.slug },
        { creator: config.slug },
      );
    };
    window.addEventListener("seerah:videoPlaying", handler);
    return () => window.removeEventListener("seerah:videoPlaying", handler);
  }, [config.slug]);

  function scrollToLesson() {
    trackEvent(
      "influencer_free_preview_clicked",
      { influencer_slug: config.slug, trigger: "sales_hero" },
      { creator: config.slug },
    );
    lessonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToPricing() {
    pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goLifetime(trigger: string) {
    trackEvent(
      "influencer_primary_cta_clicked",
      { influencer_slug: config.slug, plan: "individual-lifetime", trigger },
      { creator: config.slug },
    );
    onCheckout("lifetime");
  }

  function goMonthly(trigger: string) {
    trackEvent(
      "influencer_primary_cta_clicked",
      { influencer_slug: config.slug, plan: "individual-monthly", trigger },
      { creator: config.slug },
    );
    onCheckout("monthly");
  }

  return (
    <div className="min-h-[100dvh] bg-background text-text">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-5 pt-10 pb-12">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
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

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text leading-tight mb-3">
              {config.headline}
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-md mx-auto">
              {supportingCopy}
            </p>
          </div>

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

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => goLifetime("hero_lifetime")}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light active:scale-[0.98] text-ink font-bold text-base transition-all shadow-lg shadow-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[52px]"
            >
              Get Lifetime Access — {lifetimePrice}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollToLesson}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:border-gold/40 text-text font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[48px]"
            >
              Preview Part 1 Free
            </button>
            <p className="text-center text-xs text-zinc-500">
              One payment · Keep access forever · 7-day refund
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="px-5 py-12 border-t border-zinc-800/80">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-text text-center mb-6">
            Everything you need to learn the Seerah in order
          </h2>
          <ul className="space-y-3" aria-label="Course features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                </span>
                <span className="text-sm text-zinc-300 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Free lesson ──────────────────────────────────────────────────── */}
      <section
        id="preview"
        ref={lessonRef}
        className="px-5 py-12 border-t border-zinc-800/80 scroll-mt-4"
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          <div className="text-center">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1">
              Free · No signup required
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-text">
              Part 1 — {part1?.title ?? "The Beginning of Revelation"}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Watch, read, quiz, and review — see exactly how every lesson works.
            </p>
          </div>

          {part1 ? (
            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-surface shadow-2xl shadow-black/50">
              <div className="px-3 sm:px-5 py-5">
                <Part1PreviewTabs
                  part={part1}
                  initialAssetUrls={part1AssetUrls}
                  initialLang={initialLang}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center">
              <p className="text-zinc-500 text-sm">Part 1 preview is temporarily unavailable.</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => goLifetime("after_preview")}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 min-h-[52px]"
          >
            Continue with Lifetime — {lifetimePrice}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ── Credibility ──────────────────────────────────────────────────── */}
      <section className="px-5 py-12 border-t border-zinc-800/80">
        <div className="max-w-lg mx-auto space-y-5">
          <h2 className="text-xl font-bold text-text text-center">
            Built for serious students of the Seerah
          </h2>

          {config.testimonial ? (
            <blockquote className="rounded-2xl border border-gold/20 bg-gold/5 p-5 text-center">
              <p className="text-sm text-zinc-200 leading-relaxed italic">
                “{config.testimonial.quote}”
              </p>
              <footer className="mt-3 text-xs font-semibold text-gold">
                — {config.testimonial.attribution}
              </footer>
            </blockquote>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Recommended by {config.displayName}. One clear path through the life of the Prophet ﷺ —
                not scattered clips, not random reminders.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              "100 structured lessons",
              "Instant access after payment",
              "7-day refund guarantee",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Check className="w-3 h-3 text-gold/70" aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        ref={pricingRef}
        className="px-5 py-12 border-t border-zinc-800/80 scroll-mt-4"
      >
        <div className="max-w-lg mx-auto space-y-5">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">Simple pricing</h2>
            <p className="text-sm text-zinc-400">
              One payment. Keep access forever.
            </p>
          </div>

          {/* Lifetime — primary */}
          <div className="relative rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/10 to-zinc-950 p-6 shadow-xl shadow-gold/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink">
              Best Value
            </span>
            <div className="flex items-center gap-2 mb-1">
              <Infinity className="w-4 h-4 text-gold" aria-hidden="true" />
              <p className="text-sm font-semibold text-gold">Lifetime Access</p>
            </div>
            <p className="text-4xl font-extrabold text-text tracking-tight mb-1">
              {lifetimePrice}
              <span className="text-sm font-normal text-zinc-400 ml-1.5">one-time</span>
            </p>
            <p className="text-sm text-zinc-400 mb-5">
              One payment. Keep access forever. No renewal.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "All 100 Seerah lessons",
                "Videos, quizzes, flashcards, mind maps",
                "Progress tracking on any device",
                "7-day refund guarantee",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => goLifetime("pricing_lifetime")}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 min-h-[52px]"
            >
              Get Lifetime Access — {lifetimePrice}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Monthly — secondary / collapsed */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMonthly((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-zinc-900/60 transition-colors"
              aria-expanded={showMonthly}
            >
              <span className="text-sm text-zinc-400">Prefer a monthly option?</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform ${showMonthly ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {showMonthly && (
              <div className="px-4 pb-4 border-t border-zinc-800/80 pt-4">
                <p className="text-lg font-bold text-text mb-1">
                  {monthlyPrice}
                  <span className="text-sm font-normal text-zinc-400">/month</span>
                </p>
                <p className="text-xs text-zinc-500 mb-4">Cancel anytime. Full course access while subscribed.</p>
                <button
                  type="button"
                  onClick={() => goMonthly("pricing_monthly")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-zinc-700 hover:border-gold/40 text-text font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Start Monthly — {monthlyPrice}/mo
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold/60" aria-hidden="true" />
            Secure checkout · Instant access · 7-day refund
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-5 py-12 border-t border-zinc-800/80">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-text text-center mb-6">FAQ</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold text-text">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {open && (
                    <p className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-5 py-14 border-t border-zinc-800/80">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-text">Ready to start?</h2>
          <p className="text-sm text-zinc-400">
            One structured path through the life of the Prophet ﷺ.
          </p>
          <button
            type="button"
            onClick={() => goLifetime("final_cta")}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 min-h-[52px]"
          >
            Get Lifetime Access — {lifetimePrice}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={scrollToPricing}
            className="text-xs text-zinc-500 hover:text-gold underline underline-offset-2 transition-colors"
          >
            See pricing details
          </button>
        </div>
      </section>
    </div>
  );
}
