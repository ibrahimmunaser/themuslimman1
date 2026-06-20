"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, ChevronRight, ArrowRight } from "lucide-react";

// ── Checkout URLs ────────────────────────────────────────────────────────────────

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_checkup&utm_content=theorthodoxmuslim";
const INDIVIDUAL_MONTHLY_URL  = `/checkout?plan=individual-monthly&source=theorthodoxmuslim&${UTM}`;
const FAMILY_MONTHLY_URL      = `/checkout?plan=family-monthly&source=theorthodoxmuslim&${UTM}`;
const INDIVIDUAL_LIFETIME_URL = `/checkout?plan=individual-lifetime&source=theorthodoxmuslim&${UTM}`;
const FAMILY_LIFETIME_URL     = `/checkout?plan=family-lifetime&source=theorthodoxmuslim&${UTM}`;

// ── Questions ────────────────────────────────────────────────────────────────────
//
// Q1–Q7 are scored (max 70 raw → normalised to 100).
// Q8–Q10 are personalisation only (all scores 0).

interface Question {
  id: number;
  text: string;
  options: string[];
  scores: number[];
  category: "knowledge" | "timeline" | "consistency" | "personal";
  correctAnswer?: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which best describes your Seerah knowledge right now?",
    options: [
      "I know the full life of the Prophet ﷺ in order",
      "I know many stories, but not the full order",
      "I only know a few major events",
      "I'm basically starting from the beginning",
    ],
    scores: [10, 5, 2, 0],
    category: "knowledge",
  },
  {
    id: 2,
    text: "Have you ever completed a full Seerah series from beginning to end?",
    options: ["Yes", "I started but did not finish", "No"],
    scores: [10, 5, 0],
    category: "knowledge",
  },
  {
    id: 3,
    text: "How confident are you that you could explain the Prophet's ﷺ life in order to someone else?",
    options: [
      "Very confident",
      "I know parts, but not clearly",
      "I would struggle to explain it",
    ],
    scores: [10, 5, 0],
    category: "knowledge",
  },
  {
    id: 4,
    text: "Which order looks correct?",
    options: [
      "Revelation in Hira → Public da'wah → Boycott → Hijrah",
      "Hijrah → Revelation in Hira → Boycott → Public da'wah",
      "Boycott → Hijrah → Revelation in Hira → Public da'wah",
      "Not sure",
    ],
    scores: [10, 0, 0, 5],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 5,
    text: "Which order looks correct?",
    options: [
      "Hijrah → Badr → Hudaybiyyah → Conquest of Makkah",
      "Badr → Hijrah → Conquest of Makkah → Hudaybiyyah",
      "Hudaybiyyah → Badr → Hijrah → Conquest of Makkah",
      "Not sure",
    ],
    scores: [10, 0, 0, 5],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 6,
    text: "How do you usually learn Seerah or Islamic history?",
    options: [
      "Random short clips/posts",
      "Occasional lectures",
      "Books/articles",
      "Structured course",
      "I don't currently learn it",
    ],
    scores: [2, 5, 7, 10, 0],
    category: "consistency",
  },
  {
    id: 7,
    text: "What usually happens when you try to learn Seerah?",
    options: [
      "I stay consistent",
      "I start strong then stop",
      "I jump around randomly",
      "I don't know where to start",
    ],
    scores: [10, 5, 2, 0],
    category: "consistency",
  },
  {
    id: 8,
    text: "What usually stops you from learning consistently?",
    options: [
      "I don't know where to start",
      "I don't have enough time",
      "Books/lectures feel too long",
      "I don't remember what I learn",
      "My family/kids lose interest",
    ],
    scores: [0, 0, 0, 0, 0],
    category: "personal",
  },
  {
    id: 9,
    text: "Who are you mainly learning for?",
    options: [
      "Myself",
      "My family/kids",
      "A class/group",
      "Myself and my family",
    ],
    scores: [0, 0, 0, 0],
    category: "personal",
  },
  {
    id: 10,
    text: "What would stop you from starting today?",
    options: [
      "Price",
      "Not sure I'll use it",
      "Need to see the quality first",
      "Need family approval",
      "Don't want another subscription",
      "Nothing, I'm ready if it looks useful",
    ],
    scores: [0, 0, 0, 0, 0, 0],
    category: "personal",
  },
];

const SCORED_COUNT = 7;

// ── Scoring ──────────────────────────────────────────────────────────────────────

function computeScore(answers: Record<number, number>): number {
  let raw = 0;
  for (let i = 1; i <= SCORED_COUNT; i++) {
    const q = QUESTIONS[i - 1];
    const idx = answers[i] ?? (q.options.length - 1);
    raw += q.scores[idx] ?? 0;
  }
  return Math.min(100, Math.round((raw / 70) * 100));
}

type ResultType = "scattered" | "partial" | "strong";

function getResultType(score: number): ResultType {
  if (score <= 39) return "scattered";
  if (score <= 69) return "partial";
  return "strong";
}

const RESULT_COPY: Record<ResultType, { label: string; tagline: string; keyLine: string; color: string }> = {
  scattered: {
    label: "Scattered Foundation",
    color: "text-amber-400",
    tagline: "You know some important pieces, but your Seerah understanding is still scattered.",
    keyLine: "Your next step is to start from the beginning and follow one clear path — in order, step by step.",
  },
  partial: {
    label: "Partial Clarity",
    color: "text-gold",
    tagline: "You know important pieces, but the full order still needs structure.",
    keyLine: "Your next step is to start from the beginning and follow one clear path.",
  },
  strong: {
    label: "Strong Foundation",
    color: "text-emerald-400",
    tagline: "You have a solid foundation — but the full journey still has gaps worth filling.",
    keyLine: "Your next step is to complete the full Seerah in order and strengthen retention with review, flashcards, and quizzes.",
  },
};

function getInsights(answers: Record<number, number>) {
  const knowledgeRaw = [1, 2, 3].reduce((s, id) => {
    const q = QUESTIONS[id - 1];
    return s + (q.scores[answers[id] ?? (q.options.length - 1)] ?? 0);
  }, 0);
  const timelineRaw = [4, 5].reduce((s, id) => {
    const q = QUESTIONS[id - 1];
    return s + (q.scores[answers[id] ?? (q.options.length - 1)] ?? 0);
  }, 0);
  const consistencyRaw = [6, 7].reduce((s, id) => {
    const q = QUESTIONS[id - 1];
    return s + (q.scores[answers[id] ?? (q.options.length - 1)] ?? 0);
  }, 0);

  return {
    knowledge: {
      weak: knowledgeRaw < 20,
      text: knowledgeRaw < 20
        ? "You know some stories, but the full life of the Prophet ﷺ — in order — still needs structure."
        : "Your knowledge of the Seerah is solid. A structured path will help you complete it.",
    },
    timeline: {
      weak: timelineRaw < 15,
      text: timelineRaw < 15
        ? "The major events are not yet in clear order for you. Starting from the beginning will fix this quickly."
        : "You can place the major events in order. Keep building on this.",
    },
    consistency: {
      weak: consistencyRaw < 10,
      text: consistencyRaw < 10
        ? "Your learning is mostly random or inconsistent. A structured system with short lessons makes a big difference."
        : "You already have a learning habit. A clear path will make it much more effective.",
    },
  };
}

function getRecommendedPlan(answers: Record<number, number>) {
  const q9 = answers[9] ?? 0;
  const isFamily = q9 === 1 || q9 === 3;
  if (isFamily) {
    return {
      plan: "family-monthly", url: FAMILY_MONTHLY_URL, lifetimeUrl: FAMILY_LIFETIME_URL,
      label: "Start Family Access — $9.99/month",
      lifetimeLabel: "Prefer one payment? Lifetime family access is $99 →",
      description: "Up to 5 separate learner profiles, each tracking progress independently. One plan for your whole household.",
      isFamily: true,
    };
  }
  return {
    plan: "individual-monthly", url: INDIVIDUAL_MONTHLY_URL, lifetimeUrl: INDIVIDUAL_LIFETIME_URL,
    label: "Start Individual Access — $4.99/month",
    lifetimeLabel: "Prefer one payment? Lifetime access is $49 →",
    description: "Full access to all 100 structured parts — video, reading, slides, flashcards, quizzes, and progress tracking.",
    isFamily: false,
  };
}

// ── Analytics ─────────────────────────────────────────────────────────────────────

function track(event: string, props?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "development") console.log("[checkup]", event, props);
    const payload = JSON.stringify({ creator: "theorthodoxmuslim", eventType: event, ...props });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/influencer/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* never block */ }
}

// ── Progress bar ─────────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-muted mb-1.5">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<Question["category"], string> = {
  knowledge: "Seerah Knowledge",
  timeline: "Timeline",
  consistency: "Learning Habits",
  personal: "About You",
};

// ── Main ──────────────────────────────────────────────────────────────────────────

// Flow: questions → email gate → result
type FlowStep = "questions" | "email" | "result";

export default function CheckupClient() {
  const [step, setStep]       = useState<FlowStep>("questions");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState<Record<number, number>>({});
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [emailErr, setEmailErr] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { track("orthodox_checkup_landing_view"); }, []);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Answer ──────────────────────────────────────────────────────────────────

  function handleAnswer(optionIndex: number) {
    const q = QUESTIONS[currentQ];
    const updated = { ...answers, [q.id]: optionIndex };
    setAnswers(updated);
    track("orthodox_checkup_question_answered", { questionId: q.id, optionIndex });

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => { setCurrentQ((n) => n + 1); scrollTop(); }, 180);
    } else {
      // All questions answered — go to email gate
      track("orthodox_checkup_completed");
      setTimeout(() => { setStep("email"); scrollTop(); }, 180);
    }
  }

  // ── Email gate ──────────────────────────────────────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailErr("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr("Please enter a valid email."); return; }
    setEmailErr("");

    const score      = computeScore(answers);
    const resultType = getResultType(score);
    const rec        = getRecommendedPlan(answers);
    const params     = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

    track("orthodox_checkup_contact_submit");

    fetch("/api/checkup/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || null, email, phone: null,
        answers, score, resultType, recommendedPlan: rec.plan,
        source: "theorthodoxmuslim",
        utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"), utmContent: params.get("utm_content"),
      }),
    }).catch(() => {});

    track("orthodox_checkup_result_view", { score, resultType, recommendedPlan: rec.plan });
    setStep("result");
    scrollTop();
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const score      = computeScore(answers);
  const resultType = getResultType(score);
  const result     = RESULT_COPY[resultType];
  const insights   = getInsights(answers);
  const rec        = getRecommendedPlan(answers);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={topRef} className="min-h-screen bg-ink text-text">

      {/* Header */}
      <header className="py-4 px-4 sm:px-6 border-b border-border/30 bg-ink sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between relative">
          <Link href="/theorthodoxmuslim" className="text-sm text-text-muted hover:text-text transition-colors flex-shrink-0">
            ← Back
          </Link>

          {/* Step indicator — absolutely centred so it never overlaps side elements */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap pointer-events-none">
            <span className={step === "questions" ? "text-gold" : "text-text-muted/40"}>
              Free Seerah Checkup
            </span>
            <span className="text-text-muted/25">›</span>
            <span className={step === "email" || step === "result" ? "text-gold font-bold" : "text-text-muted/40"}>
              Your Result
            </span>
          </div>

          {/* Right side counter */}
          <span className="text-xs text-text-muted flex-shrink-0">
            {step === "questions" ? `${currentQ + 1}/10` : ""}
          </span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">

        {/* ═══ QUESTIONS ═══ */}
        {step === "questions" && (
          <div>
            {currentQ === 0 && (
              <div className="text-center mb-8">
                <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">Free · 10 questions · Instant result</p>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                  The Free Seerah Checkup
                </h1>
                <p className="text-base text-text-secondary">
                  Answer honestly. Your result is based on your real answers.
                </p>
              </div>
            )}

            <ProgressBar current={currentQ + 1} total={QUESTIONS.length} />

            <div className="mt-8 mb-6">
              <p className="text-xs font-semibold text-gold/70 uppercase tracking-widest mb-3">
                {CATEGORY_LABELS[QUESTIONS[currentQ].category]}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                {QUESTIONS[currentQ].text}
              </h2>
            </div>

            <div className="space-y-3">
              {QUESTIONS[currentQ].options.map((option, idx) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(idx)}
                  className="w-full text-left px-5 py-4 rounded-xl border border-border bg-surface hover:border-gold/50 hover:bg-gold/5 active:scale-[0.98] transition-all text-base font-medium text-text flex items-center justify-between group"
                >
                  <span>{option}</span>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-gold transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EMAIL GATE ═══ */}
        {step === "email" && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-4">
                <span className="text-2xl font-extrabold text-gold">✓</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Your score is ready
              </h2>
              <p className="text-base text-text-secondary">
                Enter your email to save your result and reveal your recommended next step.
              </p>
            </div>

            {/* Teaser — no number, no plan revealed */}
            <div className="rounded-2xl border border-gold/20 bg-surface p-5 mb-7 space-y-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">You will see</p>
              {[
                "Your Seerah Clarity Score",
                "Your strongest area",
                "Your biggest gap",
                "Your personalised next step",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-xs">→</span>
                  </div>
                  <span className="text-sm font-medium text-text">{item}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">
                  First name <span className="text-xs text-text-muted/50 font-normal ml-1">optional</span>
                </label>
                <input
                  type="text" autoComplete="given-name" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="Your first name"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 text-base transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">
                  Email address <span className="text-gold">*</span>
                </label>
                <input
                  type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 text-base transition-colors"
                />
              </div>
              {emailErr && <p className="text-sm text-red-400">{emailErr}</p>}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25 flex items-center justify-center gap-2 mt-2"
              >
                Reveal My Score
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-center text-text-muted/60">
                Instant result. No spam.
              </p>
            </form>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {step === "result" && (
          <div className="space-y-7">

            {/* Score card */}
            <div className="rounded-2xl border-2 border-gold/40 bg-surface p-6 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 400px 250px at 50% -10%, rgba(200,169,110,0.11) 0%, transparent 70%)" }}
                aria-hidden
              />
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                {name ? `${name}'s ` : "Your "}Seerah Clarity Score
              </p>
              <p className="text-8xl font-extrabold text-gold tracking-tight leading-none mb-2">
                {score}<span className="text-3xl text-gold/60 font-bold">%</span>
              </p>
              <p className={`text-xl font-bold mb-4 ${result.color}`}>{result.label}</p>
              <p className="text-sm text-text-muted/60 mb-3">Most people know pieces. The point is to find where to start.</p>
              <p className="text-base text-text-secondary leading-relaxed">{result.tagline}</p>
              <p className="text-base font-semibold text-text mt-3">{result.keyLine}</p>
            </div>

            {/* Three insights */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Your three areas</p>
              <div className="space-y-3">
                {[
                  { key: "knowledge",   label: "Knowledge Depth",      data: insights.knowledge    },
                  { key: "timeline",    label: "Timeline Accuracy",     data: insights.timeline     },
                  { key: "consistency", label: "Learning Consistency",  data: insights.consistency  },
                ].map(({ key, label, data }) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border ${data.weak ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${data.weak ? "text-amber-400" : "text-emerald-400"}`}>
                      {data.weak ? "⚠ " : "✓ "}{label}
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">{data.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended path + CTAs */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">Your recommended path</p>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                {rec.isFamily
                  ? "Based on your answers, the best next step is a structured path you can follow with your household."
                  : "Based on your answers, the best next step is to start from Part 1 and follow one clear path in order."}
              </p>
              <h3 className="text-lg font-bold text-text mb-1">
                {rec.isFamily ? "Family Access — $9.99/month" : "Individual Access — $4.99/month"}
              </h3>
              <p className="text-sm text-text-secondary mb-5">{rec.description}</p>

              <Link
                href={rec.url}
                onClick={() => track("orthodox_checkup_paid_cta_click", { plan: rec.plan })}
                className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25 mb-3"
              >
                {rec.isFamily ? "Unlock Family Access — $9.99/month" : "Unlock Individual Access — $4.99/month"}
              </Link>

              <a
                href="/theorthodoxmuslim#preview"
                onClick={() => track("orthodox_checkup_free_part1_click")}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-gold/40 text-gold font-bold text-base hover:border-gold/70 hover:bg-gold/5 transition-colors mb-4"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Part 1 Free First
              </a>

              <p className="text-xs text-center text-text-muted/60">
                Prefer one payment?{" "}
                <Link
                  href={rec.lifetimeUrl}
                  onClick={() => track("orthodox_checkup_lifetime_click")}
                  className="underline underline-offset-2 hover:text-text-muted transition-colors"
                >
                  {rec.lifetimeLabel}
                </Link>
              </p>
              <p className="text-xs text-center text-text-muted mt-4">
                Secure checkout · Instant access · Cancel anytime · 7-day refund guarantee
              </p>
            </div>

            {/* What every lesson includes */}
            <div className="rounded-xl border border-border/50 bg-surface/50 p-5 text-center">
              <p className="text-sm font-semibold text-text mb-1">Every lesson follows one simple path</p>
              <p className="text-base font-bold text-gold mb-3">Watch → Study → Review</p>
              <p className="text-xs text-text-muted/70">
                Video lesson · reading · slides · mind map · flashcards · quiz · progress tracking
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => { setStep("questions"); setCurrentQ(0); setAnswers({}); scrollTop(); }}
                className="text-sm text-text-muted/50 hover:text-text-muted transition-colors underline underline-offset-2"
              >
                Retake the checkup
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
