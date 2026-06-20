"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight, ArrowRight, BarChart2, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import dynamic from "next/dynamic";

// Lazy-load the inline Part 1 video only when the user expands it
const InlinePart1Video = dynamic(
  () => import("@/components/landing/inline-part1-video").then(m => ({ default: m.InlinePart1Video })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse">
        <div className="p-4 bg-surface-raised border-b border-border">
          <div className="h-3 bg-surface w-1/3 rounded mb-2" />
          <div className="h-5 bg-surface w-2/3 rounded" />
        </div>
        <div className="aspect-video bg-surface-raised" />
        <div className="p-6"><div className="h-10 bg-surface-raised rounded-xl" /></div>
      </div>
    ),
  },
);

// ── URLs ──────────────────────────────────────────────────────────────────────

const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_checkup&utm_content=theorthodoxmuslim";
const SRC = "source=theorthodoxmuslim";
const INDIVIDUAL_MONTHLY_URL  = `/checkout?plan=individual-monthly&${SRC}&${UTM}`;
const FAMILY_MONTHLY_URL      = `/checkout?plan=family-monthly&${SRC}&${UTM}`;
const INDIVIDUAL_LIFETIME_URL = `/checkout?plan=individual-lifetime&${SRC}&${UTM}`;
const FAMILY_LIFETIME_URL     = `/checkout?plan=family-lifetime&${SRC}&${UTM}`;
const WATCH_FREE_URL          = "/watch-free";

// ── Questions ─────────────────────────────────────────────────────────────────

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
    options: ["Very confident", "I know parts, but not clearly", "I would struggle to explain it"],
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
    options: ["Myself", "My family/kids", "A class/group", "Myself and my family"],
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

const CATEGORY_LABELS: Record<Question["category"], string> = {
  knowledge: "Seerah Knowledge",
  timeline: "Timeline",
  consistency: "Learning Habits",
  personal: "About You",
};

// ── Scoring ───────────────────────────────────────────────────────────────────

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

const RESULT_COPY: Record<ResultType, { label: string; color: string; tagline: string; keyLine: string }> = {
  scattered: {
    label: "Foundation Needs Structure", color: "text-amber-400",
    tagline: "You know some important pieces, but the full Seerah in order is still unclear.",
    keyLine: "Your next step is to start from the beginning and follow one clear path — in order, step by step.",
  },
  partial: {
    label: "Partial Clarity", color: "text-gold",
    tagline: "You know important pieces, but the full order still needs structure.",
    keyLine: "Your next step is to start from the beginning and follow one clear path.",
  },
  strong: {
    label: "Strong Foundation", color: "text-emerald-400",
    tagline: "You have a solid foundation — but the full journey still has gaps worth filling.",
    keyLine: "Your next step is to complete the full Seerah in order and strengthen retention with review, flashcards, and quizzes.",
  },
};

function getInsights(answers: Record<number, number>) {
  const kRaw = [1,2,3].reduce((s,id) => { const q = QUESTIONS[id-1]; return s + (q.scores[answers[id] ?? (q.options.length-1)] ?? 0); }, 0);
  const tRaw = [4,5].reduce((s,id) => { const q = QUESTIONS[id-1]; return s + (q.scores[answers[id] ?? (q.options.length-1)] ?? 0); }, 0);
  const cRaw = [6,7].reduce((s,id) => { const q = QUESTIONS[id-1]; return s + (q.scores[answers[id] ?? (q.options.length-1)] ?? 0); }, 0);
  return {
    knowledge: {
      weak: kRaw < 20,
      label: "Knowledge Depth",
      text: kRaw < 20
        ? "You know some stories, but the full life of the Prophet ﷺ — in order — still needs structure."
        : "Your knowledge of the Seerah is solid. A structured path will help you complete it.",
    },
    timeline: {
      weak: tRaw < 15,
      label: "Timeline Accuracy",
      text: tRaw < 15
        ? "The major events are not yet in clear order for you. Starting from the beginning will fix this quickly."
        : "You can place the major events in order. Keep building on this.",
    },
    consistency: {
      weak: cRaw < 10,
      label: "Learning Consistency",
      text: cRaw < 10
        ? "Your learning is mostly random or inconsistent. A structured system with short lessons makes a big difference."
        : "You already have a learning habit. A clear path will make it much more effective.",
    },
  };
}

// ── Recommendation ────────────────────────────────────────────────────────────

interface Rec {
  primaryLabel: string;
  primaryUrl: string;
  primarySupport?: string;
  showFreePrimary: boolean;
  // Secondary option shown below the primary CTA
  secondaryUrl?: string;
  secondaryLabel?: string;     // clean button label e.g. "Unlock Individual Access — $4.99/month"
  secondaryPreamble?: string;  // one-liner above the button e.g. "Want the full 100-part path?"
  // Tertiary text link (lifetime alt or free-first alt)
  lifetimeUrl?: string;
  lifetimeLabel?: string;
  bridgeCopy: string;
  trackEvent: string;
}

function getRecommendation(answers: Record<number, number>): Rec {
  const q9  = answers[9]  ?? 0; // who for
  const q10 = answers[10] ?? 5; // what stops you

  const isFamily = q9 === 1 || q9 === 3;

  // Q10 overrides
  if (q10 === 2) {
    return {
      primaryLabel: "Watch Part 1 Free",
      primaryUrl: WATCH_FREE_URL,
      primarySupport: "Full first lesson — video, reading, slides, flashcards, quiz. No payment.",
      showFreePrimary: true,
      secondaryUrl: isFamily ? FAMILY_MONTHLY_URL : INDIVIDUAL_MONTHLY_URL,
      secondaryLabel: isFamily ? "Unlock Family Access — $9.99/month" : "Unlock Individual Access — $4.99/month",
      secondaryPreamble: isFamily ? "Want to keep going as a family?" : "Ready to continue after Part 1?",
      bridgeCopy: "Because you said you want to see the quality first, your best next step is to watch Part 1 free.",
      lifetimeUrl: isFamily ? FAMILY_LIFETIME_URL : INDIVIDUAL_LIFETIME_URL,
      lifetimeLabel: isFamily ? "Or pay once — family lifetime is $99 →" : "Or pay once — lifetime is $49 →",
      trackEvent: "orthodox_watch_free_click",
    };
  }

  if (q10 === 1) {
    return {
      primaryLabel: "Watch Part 1 Free",
      primaryUrl: WATCH_FREE_URL,
      primarySupport: "Full first lesson — no payment, no commitment. You'll know in 10 minutes.",
      showFreePrimary: true,
      secondaryUrl: isFamily ? FAMILY_MONTHLY_URL : INDIVIDUAL_MONTHLY_URL,
      secondaryLabel: isFamily ? "Unlock Family Access — $9.99/month" : "Unlock Individual Access — $4.99/month",
      secondaryPreamble: isFamily ? "Want to keep going as a family?" : "Ready to continue after Part 1?",
      bridgeCopy: "Because you're not sure if you'll use it, start with Part 1 free — no payment or commitment required. You'll know within 10 minutes.",
      lifetimeUrl: isFamily ? FAMILY_LIFETIME_URL : INDIVIDUAL_LIFETIME_URL,
      lifetimeLabel: isFamily ? "Or pay once — family lifetime is $99 →" : "Or pay once — lifetime is $49 →",
      trackEvent: "orthodox_watch_free_click",
    };
  }

  if (q10 === 4) {
    return {
      primaryLabel: isFamily ? "Unlock Family Lifetime Access — $99" : "Unlock Lifetime Access — $49",
      primaryUrl: isFamily ? FAMILY_LIFETIME_URL : INDIVIDUAL_LIFETIME_URL,
      primarySupport: "One-time payment. No subscription. Yours forever.",
      showFreePrimary: false,
      lifetimeUrl: isFamily ? FAMILY_MONTHLY_URL : INDIVIDUAL_MONTHLY_URL,
      lifetimeLabel: isFamily ? "Or start monthly — $9.99/month" : "Or start monthly — $4.99/month",
      bridgeCopy: "Because you prefer a one-time payment, lifetime access is the right choice — pay once and the full course is yours forever.",
      trackEvent: "orthodox_lifetime_click",
    };
  }

  if (isFamily) {
    const bridgeFam = q10 === 3
      ? "The family plan gives everyone in your household their own profile and progress tracker — discuss it together, then start."
      : "Based on your answers, the best next step is a structured path you can follow with your household.";
    return {
      primaryLabel: "Unlock Family Access — $9.99/month",
      primaryUrl: FAMILY_MONTHLY_URL,
      primarySupport: "Up to 5 learner profiles. Cancel anytime.",
      showFreePrimary: false,
      lifetimeUrl: FAMILY_LIFETIME_URL,
      lifetimeLabel: "Prefer one payment? Family lifetime is $99 →",
      bridgeCopy: bridgeFam,
      trackEvent: "orthodox_recommended_plan_click",
    };
  }

  const priceSensitive = q10 === 0;
  return {
    primaryLabel: "Unlock Individual Access — $4.99/month",
    primaryUrl: INDIVIDUAL_MONTHLY_URL,
    primarySupport: priceSensitive ? "Less than most streaming subscriptions. Cancel anytime." : "Cancel anytime. Instant access.",
    showFreePrimary: false,
    lifetimeUrl: INDIVIDUAL_LIFETIME_URL,
    lifetimeLabel: "Prefer one payment? Lifetime is $49 →",
    bridgeCopy: priceSensitive
      ? "At $4.99/month, this is less than most streaming subscriptions — and it's structured learning you can actually continue."
      : "Based on your answers, the best next step is to start from Part 1 and follow one clear path in order.",
    trackEvent: "orthodox_recommended_plan_click",
  };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function track(event: string, props?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "development") console.log("[orthodox]", event, props);
    const payload = JSON.stringify({ creator: "theorthodoxmuslim", eventType: event, ...props });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/influencer/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* never block */ }
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ = [
  { q: "Is Part 1 free?",          a: "Yes. Full video, reading, slides, flashcards, and quiz — no signup or payment required." },
  { q: "What happens after I buy?", a: "Immediate access. Set your password, create your profile, and start Part 1 — under 60 seconds." },
  { q: "Can I cancel anytime?",     a: "Yes. Cancel in 2 clicks from your dashboard. No call required." },
  { q: "Is there a refund?",        a: "Yes — 7-day clarity guarantee. If the course doesn't feel right, email us for a full refund. No questions asked." },
  { q: "Can my family use it?",     a: "Yes. The family plan includes up to 5 separate learner profiles, each tracking their own progress." },
  { q: "Can I use it on mobile?",   a: "Yes. Works on phone, tablet, and desktop. Many students learn during commutes or before bed." },
];

// ── Score Gauge ───────────────────────────────────────────────────────────────
// NOTE: Needle uses SVG `transform` attribute (not CSS transform) so rotation
// pivots correctly in SVG user-units regardless of how the SVG scales on screen.
// CSS transform uses CSS px, which breaks when viewBox ≠ rendered px size.

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

// Gentle spring: settles with a ~4% overshoot then snaps back
function easeOutSpring(t: number) {
  const c1 = 0.8, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function ScoreGauge({ score, resultType, name }: { score: number; resultType: ResultType; name: string }) {
  // Single animated value drives arc fill + counter (no overshoot)
  const [animScore, setAnimScore]       = useState(0);
  // Separate value drives needle with spring feel
  const [needleVal, setNeedleVal]       = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startMs  = performance.now();
    const duration = 1500;

    const delay = setTimeout(() => {
      function step(now: number) {
        const t      = Math.min((now - startMs) / duration, 1);
        const smooth = easeOutCubic(t);
        const spring = easeOutSpring(t);
        setAnimScore(smooth * score);
        setNeedleVal(spring * score);          // may slightly exceed score
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setAnimScore(score);
          setNeedleVal(score);
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }, 280);

    return () => {
      clearTimeout(delay);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  // SVG geometry — all in SVG user units
  const cx = 160, cy = 155, r = 118;
  const arcLen = Math.PI * r;

  // Needle angle: −90° at score=0 (pointing left/9 o'clock),
  //                0° at score=50 (pointing up/12 o'clock),
  //               +90° at score=100 (pointing right/3 o'clock)
  // SVG rotate() is clockwise; needle drawn pointing up → -90 puts it at left arc endpoint
  const needleAngle = -90 + (needleVal / 100) * 180;
  const fillOffset  = arcLen - (arcLen * animScore / 100);
  const countNum    = Math.round(animScore);

  // Zone boundary positions on the arc (in SVG user units)
  function arcPt(pct: number) {
    const a = (180 - pct * 1.8) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  }
  const t39 = arcPt(39);
  const t70 = arcPt(70);

  const result = RESULT_COPY[resultType];

  return (
    <div className="w-full">
      {/* Constrained width on mobile so the gauge doesn't dominate the whole screen */}
      <svg viewBox="0 -16 320 216" className="w-full max-w-[270px] sm:max-w-none mx-auto" aria-hidden>
        <defs>
          <linearGradient id="og-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ef4444" />
            <stop offset="38%"  stopColor="#f97316" />
            <stop offset="69%"  stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Dark base track */}
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="24" strokeLinecap="round" />

        {/* Faint full-range gradient (shows where they could be) */}
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="url(#og-gauge-grad)" strokeWidth="24" strokeLinecap="round"
          opacity="0.18" />

        {/* Animated fill — SVG attribute, driven by RAF state */}
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="url(#og-gauge-grad)" strokeWidth="24" strokeLinecap="round"
          strokeDasharray={arcLen} strokeDashoffset={fillOffset} />

        {/* Zone boundary ticks */}
        <circle cx={t39.x} cy={t39.y} r="5" fill="#0d0d0d" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        <circle cx={t70.x} cy={t70.y} r="5" fill="#0d0d0d" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />

        {/* Zone labels */}
        <text x={cx-r+2}  y={cy+24} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="start">Scattered</text>
        <text x={cx}      y={cy-r-10} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="middle">Partial</text>
        <text x={cx+r-2}  y={cy+24} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="end">Strong</text>

        {/* ── Needle — SVG transform, not CSS, so pivot is always correct ── */}
        <g transform={`rotate(${needleAngle}, ${cx}, ${cy})`}>
          {/* Shaft */}
          <line x1={cx} y1={cy-16} x2={cx} y2={cy-r+14}
            stroke="rgba(255,255,255,0.88)" strokeWidth="3" strokeLinecap="round" />
          {/* Tip dot */}
          <circle cx={cx} cy={cy-r+14} r="5" fill="white" opacity="0.85" />
          {/* Pivot ring */}
          <circle cx={cx} cy={cy} r="12" fill="#0d0d0d" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          {/* Gold center pin */}
          <circle cx={cx} cy={cy} r="4.5" fill="#c8a96e" />
        </g>
      </svg>

      {/* Score number + label below gauge */}
      <div className="text-center mt-1">
        <p className="text-[0.6rem] font-bold text-text-muted/50 uppercase tracking-widest mb-2">
          {name ? `${name}'s ` : "Your "}Seerah Clarity Score
        </p>
        <p className="text-[4rem] sm:text-[6rem] font-extrabold text-gold tracking-tight leading-none">
          {countNum}<span className="text-2xl sm:text-4xl text-gold/40 font-bold">%</span>
        </p>
        <p className={`text-xl sm:text-3xl font-bold mt-2 ${result.color}`}>{result.label}</p>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-6">
      <p className="text-xs text-text-muted/60 mb-1.5">Question {current} of {total}</p>
      <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Trust strip ───────────────────────────────────────────────────────────────

function TrustStrip() {
  return (
    <p className="text-xs text-text-muted/70 text-center mt-3">
      Secure checkout · Instant access · Cancel anytime · 7-day refund guarantee
    </p>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Phase = "idle" | "quiz" | "email" | "result";

export default function OrthodoxFunnelClient() {
  const [phase, setPhase]                   = useState<Phase>("idle");
  const [currentQ, setCurrentQ]             = useState(0);
  const [answers, setAnswers]               = useState<Record<number, number>>({});
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [emailErr, setEmailErr]             = useState("");
  const [faqOpen, setFaqOpen]               = useState<number | null>(null);
  const [showInlinePreview, setShowInline]  = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const quizRef    = useRef<HTMLDivElement>(null);
  const inlineRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { track("orthodox_landing_view"); }, []);

  function startQuiz() {
    track("orthodox_quiz_start");
    setPhase("quiz");
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function handleAnswer(optionIndex: number) {
    const q = QUESTIONS[currentQ];
    setSelectedAnswer(optionIndex);                          // instant visual confirm
    const updated = { ...answers, [q.id]: optionIndex };
    setAnswers(updated);
    track("orthodox_quiz_question_answered", { questionId: q.id, optionIndex });

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => { setSelectedAnswer(null); setCurrentQ(n => n + 1); }, 260);
    } else {
      track("orthodox_quiz_completed");
      setTimeout(() => { setSelectedAnswer(null); setPhase("email"); }, 260);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailErr("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr("Please enter a valid email."); return; }
    setEmailErr("");

    const score      = computeScore(answers);
    const resultType = getResultType(score);
    const rec        = getRecommendation(answers);
    const params     = new URLSearchParams(window.location.search);

    track("orthodox_email_reveal_submit");

    fetch("/api/checkup/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || null, email, phone: null, answers, score, resultType,
        recommendedPlan: rec.trackEvent === "orthodox_lifetime_click"
          ? (answers[9] === 1 || answers[9] === 3 ? "family-lifetime" : "individual-lifetime")
          : (answers[9] === 1 || answers[9] === 3 ? "family-monthly" : "individual-monthly"),
        source: "theorthodoxmuslim",
        utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"), utmContent: params.get("utm_content"),
      }),
    }).catch(() => {});

    track("orthodox_result_view", { score, resultType });
    setPhase("result");
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const score      = computeScore(answers);
  const resultType = getResultType(score);
  const result     = RESULT_COPY[resultType];
  const insights   = getInsights(answers);
  const rec        = getRecommendation(answers);

  const isResultPhase = phase === "result";

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">

      {/* ── Header ── */}
      <header className="py-4 px-4 sm:px-6 border-b border-border/30 bg-ink sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/images/logoicon.png" alt="The Muslim Man" width={967} height={219} className="h-9 sm:h-10 w-auto" priority />
          </Link>
          {isResultPhase && (
            <button
              onClick={() => { setPhase("quiz"); setCurrentQ(0); setAnswers({}); setName(""); setEmail(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-text-muted/50 hover:text-text-muted transition-colors underline underline-offset-2">
              Retake checkup
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO — hidden once result is revealed
      ══════════════════════════════════════════════════════ */}
      {!isResultPhase && (
        <section className="relative pt-16 pb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(200,169,110,0.12) 0%, transparent 70%)" }}
            aria-hidden />

          <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <p className="text-sm font-bold text-gold mb-1">As seen on The Orthodox Muslim</p>
            <p className="text-xs text-text-muted mb-8">Built from reliable Islamic source material and structured for serious learning.</p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.06] mb-5">
              Do You Know the Prophet&apos;s ﷺ Life in Order —{" "}
              <span className="text-gradient-gold">or Only Scattered Stories?</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              Take the free 2-minute Seerah Checkup and see where your understanding is strong, where it is scattered, and what to study next.
            </p>

            <button
              onClick={startQuiz}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-12 py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25"
            >
              <BarChart2 className="w-5 h-5" />
              Start My Free Seerah Checkup
            </button>
            <p className="text-xs text-text-muted/70 mt-3 mb-5">10 questions · 2 minutes · instant result · no payment</p>

            <p className="text-sm text-text-muted/60">
              Not ready?{" "}
              <Link href={WATCH_FREE_URL} onClick={() => track("orthodox_watch_free_click")}
                className="text-text-muted hover:text-gold underline underline-offset-2 transition-colors">
                Watch Part 1 free first
              </Link>
            </p>

            {/* Result preview card */}
            <div className="mt-10 mx-auto max-w-sm rounded-2xl border border-gold/20 bg-surface p-5 text-left">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Your result will show</p>
              {[
                { label: "Seerah Clarity Score", value: "0 – 100" },
                { label: "Timeline accuracy",     value: "Can you place events in order?" },
                { label: "Connection strength",   value: "Do the events connect for you?" },
                { label: "Learning consistency",  value: "Is your approach structured?" },
                { label: "Personalised next step",value: "Based on your answers" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold/50 flex-shrink-0" />
                    <span className="text-sm font-medium text-text">{label}</span>
                  </div>
                  <span className="text-xs text-text-muted">{value}</span>
                </div>
              ))}
              <button
                onClick={startQuiz}
                className="mt-4 w-full py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/15 transition-colors"
              >
                Reveal My Seerah Score →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          QUIZ / EMAIL area  (max-w-2xl)
          RESULT area (max-w-2xl, replaces hero entirely)
      ══════════════════════════════════════════════════════ */}
      <div
        ref={quizRef}
        className="scroll-mt-20 max-w-[700px] mx-auto w-full px-4 sm:px-6 pb-24"
        id="quiz"
      >

        {/* ── QUIZ ── */}
        {phase === "quiz" && currentQ < QUESTIONS.length && (
          <div className="py-10">
            <ProgressBar current={currentQ + 1} total={QUESTIONS.length} />

            <p className="text-[10px] font-semibold text-text-muted/40 uppercase tracking-widest mb-2">
              {CATEGORY_LABELS[QUESTIONS[currentQ].category]}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-7">
              {QUESTIONS[currentQ].text}
            </h2>

            <div className="space-y-2.5">
              {QUESTIONS[currentQ].options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all text-base font-medium
                      ${isSelected
                        ? "border-gold bg-gold/10 text-gold scale-[0.99]"
                        : "border-border bg-surface hover:border-gold/40 hover:bg-gold/5 active:scale-[0.98] text-text"
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EMAIL GATE — minimal, fast path to reveal ── */}
        {phase === "email" && (
          <div className="py-10">
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 border border-gold/25 mb-4">
                <span className="text-xl font-extrabold text-gold">✓</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Your score is ready</h2>
              <p className="text-base text-text-secondary">Enter your email to unlock it.</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input type="email" autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Email address"
                autoFocus
                className="w-full px-4 py-4 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 text-base transition-colors" />
              <input type="text" autoComplete="given-name" value={name}
                onChange={e => setName(e.target.value)} placeholder="First name (optional)"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 text-base transition-colors" />
              {emailErr && <p className="text-sm text-red-400">{emailErr}</p>}
              <button type="submit"
                className="w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25 flex items-center justify-center gap-2">
                Reveal My Seerah Score
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-center text-text-muted/55">Instant result. No spam.</p>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            RESULT PAGE — takes over entire below-header space
            Order: Score → Explanation → Recommendation + CTA
                   → Insights → FAQ → Footer
        ══════════════════════════════════════════════════════ */}
        {phase === "result" && (
          <div className="pt-5 pb-10 sm:py-10 space-y-6 sm:space-y-8">

            {/* 1. Score card — animated gauge reveal */}
            <div className="rounded-2xl border-2 border-gold/30 bg-surface relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 600px 350px at 50% -5%, rgba(200,169,110,0.10) 0%, transparent 65%)" }}
                aria-hidden />
              <div className="relative px-4 pt-4 pb-4 sm:px-6 sm:pt-8 sm:pb-7">
                <ScoreGauge score={score} resultType={resultType} name={name} />
                <div className="w-full h-px bg-border/40 mt-4 mb-4 sm:mt-7 sm:mb-6" />
                <p className="text-base sm:text-xl font-medium text-text-secondary leading-relaxed text-center">{result.tagline}</p>
              </div>
            </div>

            {/* 2. Recommendation card — gold border, dominant */}
            <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-b from-gold/[0.06] to-surface p-7 sm:p-9 shadow-xl shadow-gold/5">
              <p className="text-xl sm:text-2xl font-bold text-text mb-3">Your Best Next Step</p>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-7">{rec.bridgeCopy}</p>

              {rec.showFreePrimary ? (
                <>
                  <button
                    onClick={() => {
                      track("orthodox_result_watch_part1_expand");
                      setShowInline(true);
                      setTimeout(() => inlineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-xl transition-colors shadow-lg shadow-gold/30 mb-3"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {rec.primaryLabel}
                  </button>
                  {rec.primarySupport && (
                    <p className="text-sm text-center text-text-muted/65 mb-5">{rec.primarySupport}</p>
                  )}
                  {rec.secondaryUrl && rec.secondaryLabel && (
                    <>
                      {rec.secondaryPreamble && (
                        <p className="text-sm text-center text-text-muted/65 mb-2">{rec.secondaryPreamble}</p>
                      )}
                      <Link href={rec.secondaryUrl}
                        onClick={() => track("orthodox_recommended_plan_click")}
                        className="block w-full py-4 rounded-xl border-2 border-gold/35 text-gold font-bold text-base text-center hover:border-gold/60 hover:bg-gold/5 transition-colors mb-2">
                        {rec.secondaryLabel}
                      </Link>
                      <p className="text-xs text-center text-text-muted/55 mb-4">Start today. Continue at your own pace.</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href={rec.primaryUrl}
                    onClick={() => track(rec.trackEvent, { plan: rec.primaryUrl })}
                    className="block w-full py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-xl text-center transition-colors shadow-lg shadow-gold/30 mb-2">
                    {rec.primaryLabel}
                  </Link>
                  <p className="text-xs text-center text-text-muted/55 mb-2">Start today. Continue at your own pace.</p>
                  {rec.primarySupport && (
                    <p className="text-sm text-center text-text-muted/65 mb-4">{rec.primarySupport}</p>
                  )}
                  <p className="text-sm text-center text-text-muted/55 mb-4">
                    Not ready?{" "}
                    <Link href={WATCH_FREE_URL}
                      onClick={() => track("orthodox_watch_free_click")}
                      className="text-text-muted hover:text-gold underline underline-offset-2 transition-colors">
                      Watch Part 1 free first
                    </Link>
                  </p>
                  {rec.lifetimeUrl && rec.lifetimeLabel && (
                    <p className="text-sm text-center text-text-muted/55">
                      <Link href={rec.lifetimeUrl}
                        onClick={() => track("orthodox_lifetime_click")}
                        className="underline underline-offset-2 hover:text-text-muted transition-colors">
                        {rec.lifetimeLabel}
                      </Link>
                    </p>
                  )}
                </>
              )}

              <TrustStrip />
            </div>

            {/* Inline Part 1 preview — lazy-loaded only when user expands it */}
            {showInlinePreview && (
              <div ref={inlineRef} className="scroll-mt-24">
                <InlinePart1Video
                  checkoutUrl={rec.secondaryUrl ?? INDIVIDUAL_MONTHLY_URL}
                  checkoutLabel={rec.secondaryLabel}
                  onVideoStart={() => track("orthodox_inline_part1_started")}
                  onUnlockClick={() => track("orthodox_inline_part1_unlock_click")}
                />
              </div>
            )}

            {/* 3. What your score means + insights */}
            <div>
              <p className="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-2">What your score means</p>
              <p className="text-base text-text-secondary mb-5 leading-relaxed">{result.keyLine}</p>
              <div className="space-y-3">
                {Object.values(insights).map(({ label, weak, text }) => (
                  <div key={label}
                    className={`p-5 rounded-xl border ${weak ? "border-amber-500/25 bg-amber-500/5" : "border-emerald-500/25 bg-emerald-500/5"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${weak ? "text-amber-400" : "text-emerald-400"}`}>
                      {weak ? "⚠ " : "✓ "}{label}
                    </p>
                    <p className="text-base text-text-secondary leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. FAQ */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Quick questions</p>
              <div className="space-y-2">
                {FAQ.map(({ q, a }, i) => (
                  <div key={q} className="rounded-xl border border-border bg-surface overflow-hidden">
                    <button
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-text">{q}</span>
                      <ChevronRight className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ml-2 ${faqOpen === i ? "rotate-90" : ""}`} />
                    </button>
                    {faqOpen === i && (
                      <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">{a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {isResultPhase ? (
        <footer className="mt-auto py-8 text-center">
          <p className="text-xs text-text-muted/40">
            © The Muslim Man · <Link href="/privacy" className="hover:text-text-muted transition-colors">Privacy</Link> · <Link href="/terms" className="hover:text-text-muted transition-colors">Terms</Link>
          </p>
        </footer>
      ) : (
        <div className="mt-auto">
          <Footer />
        </div>
      )}

      {/* ── Mobile sticky bar — hero: two CTAs / result: primary action ── */}
      {phase === "idle" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-3 py-2.5 flex gap-2">
          <Link href={WATCH_FREE_URL} onClick={() => track("orthodox_watch_free_click")}
            className="flex-1 flex items-center justify-center py-3 rounded-xl border border-gold/40 text-gold font-bold text-sm transition-colors hover:bg-gold/5">
            Watch Free
          </Link>
          <button onClick={startQuiz}
            className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
            Seerah Checkup
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/97 border-t border-gold/20 backdrop-blur-sm px-3 py-2.5">
          {rec.showFreePrimary && !showInlinePreview ? (
            /* Free path, preview not yet opened → invite them to watch */
            <button
              onClick={() => {
                track("orthodox_result_watch_part1_expand");
                setShowInline(true);
                setTimeout(() => inlineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
              <Play className="w-4 h-4 fill-current" />
              Watch Part 1 Free
            </button>
          ) : rec.showFreePrimary && showInlinePreview ? (
            /* Free path, preview open → upgrade prompt */
            <Link
              href={rec.secondaryUrl ?? INDIVIDUAL_MONTHLY_URL}
              onClick={() => track("orthodox_recommended_plan_click")}
              className="flex w-full items-center justify-center py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
              {rec.secondaryUrl?.includes("family") ? "Unlock Family Access — $9.99/mo" : "Unlock Individual Access — $4.99/mo"}
            </Link>
          ) : (
            /* Paid-primary path */
            <Link href={rec.primaryUrl}
              onClick={() => track(rec.trackEvent)}
              className="flex w-full items-center justify-center py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
              {rec.primaryUrl.includes("family") ? "Unlock Family Access — $9.99/mo" : "Unlock Individual Access — $4.99/mo"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
