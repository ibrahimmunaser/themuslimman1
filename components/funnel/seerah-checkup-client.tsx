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

// ── Props ──────────────────────────────────────────────────────────────────────

export interface SeerahCheckupUrls {
  individualMonthly: string;
  familyMonthly: string;
  individualLifetime: string;
  familyLifetime: string;
  watchFree?: string;
}

export interface SeerahCheckupClientProps {
  /** Creator slug used for analytics payloads and API submit source. */
  creator: string;
  /** Badge text shown above the headline, e.g. "As seen on Deen Responds". */
  sourceBadge: string;
  /** Analytics event prefix, e.g. "deen_". Must end with underscore. */
  eventPrefix: string;
  /** Checkout + free-watch URLs. */
  urls: SeerahCheckupUrls;
}

// ── Questions ─────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  options: string[];
  scores: number[];
  category: "knowledge" | "timeline" | "personal";
  correctAnswer?: number;
}

// Questions 1–8 are factual (10 pts each if correct, 0 otherwise).
// Questions 9–10 are personal and used only for recommendation routing.
const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Where was the Prophet Muhammad ﷺ born?",
    options: ["Makkah", "Madinah", "Ta'if", "Jerusalem"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "knowledge",
  },
  {
    id: 2,
    text: "What was the Prophet's father's name?",
    options: ["Abdullah", "Abu Talib", "Abdul Muttalib", "Hamzah"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "knowledge",
  },
  {
    id: 3,
    text: "Who was the Prophet's first wife?",
    options: ["Aisha", "Khadijah", "Hafsah", "Fatimah"],
    scores: [0, 10, 0, 0],
    correctAnswer: 1,
    category: "knowledge",
  },
  {
    id: 4,
    text: "Where did the first revelation come to the Prophet ﷺ?",
    options: ["Cave Hira", "Mount Uhud", "Masjid al-Nabawi", "Ta'if"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 5,
    text: "What happened first in the Seerah?",
    options: ["The first revelation", "The Hijrah", "The Battle of Badr", "The Conquest of Makkah"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 6,
    text: "Which city did the Prophet ﷺ migrate to during the Hijrah?",
    options: ["Madinah", "Ta'if", "Yemen", "Syria"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 7,
    text: "Which happened first?",
    options: ["The Hijrah", "The Battle of Badr", "The Treaty of Hudaybiyyah", "The Conquest of Makkah"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 8,
    text: "Which event happened before the Conquest of Makkah?",
    options: ["Treaty of Hudaybiyyah", "Farewell Hajj", "Battle of Hunayn", "Death of the Prophet ﷺ"],
    scores: [10, 0, 0, 0],
    correctAnswer: 0,
    category: "timeline",
  },
  {
    id: 9,
    text: "What usually stops you from learning the Seerah consistently?",
    options: [
      "I don't know where to start",
      "Books and lectures feel too long",
      "I forget what I learn",
      "I get busy and stop",
      "I want to see the quality first",
    ],
    scores: [0, 0, 0, 0, 0],
    category: "personal",
  },
  {
    id: 10,
    text: "Who are you mainly learning for?",
    options: ["Myself", "My family/kids", "Myself and my family", "A class or group"],
    scores: [0, 0, 0, 0],
    category: "personal",
  },
];

// Questions 1–8 are scored (10 pts each correct = 80 max → normalised to 100).
const SCORED_COUNT = 8;

const CATEGORY_LABELS: Record<Question["category"], string> = {
  knowledge: "About the Prophet ﷺ",
  timeline: "Seerah Timeline",
  personal: "About You",
};

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeScore(answers: Record<number, number>): number {
  let raw = 0;
  for (let i = 1; i <= SCORED_COUNT; i++) {
    const q = QUESTIONS[i - 1];
    const idx = answers[i] ?? -1; // unanswered = 0 pts
    if (idx >= 0) raw += q.scores[idx] ?? 0;
  }
  return Math.min(100, Math.round((raw / 80) * 100));
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
    tagline: "Most of the key facts and events are still unclear — but that is exactly what a structured Seerah course fixes.",
    keyLine: "Your next step is to start from the beginning and follow one clear path — in order, step by step.",
  },
  partial: {
    label: "Partial Clarity", color: "text-gold",
    tagline: "You know some important facts and events, but the full picture is not yet in order.",
    keyLine: "Your next step is to fill the gaps with a structured path from the beginning.",
  },
  strong: {
    label: "Strong Foundation", color: "text-emerald-400",
    tagline: "You already know the key facts — completing the full 100-part path will turn that into mastery.",
    keyLine: "Your next step is to go through the full Seerah in order and strengthen retention with quizzes and flashcards.",
  },
};

function getInsights(answers: Record<number, number>) {
  // Knowledge: Q1–3 (max 30 pts). Threshold: <20 = weak (fewer than 2 correct).
  const kRaw = [1,2,3].reduce((s,id) => {
    const q = QUESTIONS[id-1];
    const idx = answers[id] ?? -1;
    return s + (idx >= 0 ? (q.scores[idx] ?? 0) : 0);
  }, 0);
  // Timeline: Q4–8 (max 50 pts). Threshold: <30 = weak (fewer than 3 correct).
  const tRaw = [4,5,6,7,8].reduce((s,id) => {
    const q = QUESTIONS[id-1];
    const idx = answers[id] ?? -1;
    return s + (idx >= 0 ? (q.scores[idx] ?? 0) : 0);
  }, 0);
  return {
    knowledge: {
      weak: kRaw < 20,
      label: "Foundational Knowledge",
      text: kRaw < 20
        ? "Some key facts about the Prophet ﷺ are still unclear. The full Seerah course builds this foundation from the very beginning."
        : "Your foundational knowledge about the Prophet ﷺ is solid. A structured path will complete the picture.",
    },
    timeline: {
      weak: tRaw < 30,
      label: "Timeline Accuracy",
      text: tRaw < 30
        ? "The order of events in the Seerah is not yet fully clear. Starting from Part 1 and going in sequence will fix this quickly."
        : "You can place the major events in order. Completing the full 100-part path will strengthen this further.",
    },
  };
}

// ── Recommendation ────────────────────────────────────────────────────────────

interface Rec {
  primaryLabel: string;
  primaryUrl: string;
  primarySupport?: string;
  showFreePrimary: boolean;
  secondaryUrl?: string;
  secondaryLabel?: string;
  secondaryPreamble?: string;
  lifetimeUrl?: string;
  lifetimeLabel?: string;
  bridgeCopy: string;
  trackEvent: string;
}

function getRecommendation(answers: Record<number, number>, urls: SeerahCheckupUrls, eventPrefix: string): Rec {
  const watchFreeUrl = urls.watchFree ?? "/watch-free";
  // Q9: what stops you (0=don't know where to start, 1=too long, 2=forget, 3=get busy, 4=quality first)
  const q9  = answers[9]  ?? 3;
  // Q10: who for (0=myself, 1=family/kids, 2=myself+family, 3=class/group)
  const q10 = answers[10] ?? 0;
  const isFamily = q10 === 1 || q10 === 2;

  // "I want to see the quality first" → free preview path
  if (q9 === 4) {
    return {
      primaryLabel: "Watch Part 1 Free",
      primaryUrl: watchFreeUrl,
      primarySupport: "Full first lesson — video, reading, slides, flashcards, quiz. No payment.",
      showFreePrimary: true,
      secondaryUrl: isFamily ? urls.familyMonthly : urls.individualMonthly,
      secondaryLabel: isFamily ? "Unlock Family Access — $9.99/month" : "Unlock Individual Access — $4.99/month",
      secondaryPreamble: isFamily ? "Want to keep going as a family?" : "Ready to continue after Part 1?",
      bridgeCopy: "Because you want to see the quality first, start with Part 1 free — full video, flashcards, and quiz included. No payment required.",
      lifetimeUrl: isFamily ? urls.familyLifetime : urls.individualLifetime,
      lifetimeLabel: isFamily ? "Or pay once — family lifetime is $99 →" : "Or pay once — lifetime is $49 →",
      trackEvent: `${eventPrefix}watch_free_click`,
    };
  }

  // "I don't know where to start" → ease them in with Part 1 free
  if (q9 === 0) {
    return {
      primaryLabel: "Watch Part 1 Free",
      primaryUrl: watchFreeUrl,
      primarySupport: "Part 1 is the very beginning of the full path. No payment, no commitment.",
      showFreePrimary: true,
      secondaryUrl: isFamily ? urls.familyMonthly : urls.individualMonthly,
      secondaryLabel: isFamily ? "Unlock Family Access — $9.99/month" : "Unlock Individual Access — $4.99/month",
      secondaryPreamble: isFamily ? "Want to keep going as a family?" : "Ready to continue after Part 1?",
      bridgeCopy: "The best move when you don't know where to start is to simply start from Part 1 — free, in order, no commitment.",
      lifetimeUrl: isFamily ? urls.familyLifetime : urls.individualLifetime,
      lifetimeLabel: isFamily ? "Or pay once — family lifetime is $99 →" : "Or pay once — lifetime is $49 →",
      trackEvent: `${eventPrefix}watch_free_click`,
    };
  }

  if (isFamily) {
    const bridgeFam =
      q9 === 1
        ? "Each lesson is short and focused — easy to fit in as a family. The family plan gives everyone their own profile and progress."
        : q9 === 2
          ? "Every lesson ends with a quiz and flashcards — so what you learn actually sticks. The family plan gives each learner their own profile."
          : "Based on your answers, the best next step is a structured path your whole household can follow together.";
    return {
      primaryLabel: "Unlock Family Access — $9.99/month",
      primaryUrl: urls.familyMonthly,
      primarySupport: "Up to 5 learner profiles. Cancel anytime.",
      showFreePrimary: false,
      lifetimeUrl: urls.familyLifetime,
      lifetimeLabel: "Prefer one payment? Family lifetime is $99 →",
      bridgeCopy: bridgeFam,
      trackEvent: `${eventPrefix}recommended_plan_click`,
    };
  }

  const bridgeCopy =
    q9 === 1
      ? "Each lesson is short and focused — one topic, under 15 minutes. Easy to fit into your day without it feeling like a long lecture."
      : q9 === 2
        ? "Every lesson includes flashcards and a quiz so what you learn actually sticks — not just watch and forget."
        : q9 === 3
          ? "The 100-part structure means you always know exactly where to pick back up. No replanning, no lost progress."
          : "Based on your answers, the best next step is to start from Part 1 and follow one clear path in order.";

  return {
    primaryLabel: "Unlock Individual Access — $4.99/month",
    primaryUrl: urls.individualMonthly,
    primarySupport: "Cancel anytime. Instant access.",
    showFreePrimary: false,
    lifetimeUrl: urls.individualLifetime,
    lifetimeLabel: "Prefer one payment? Lifetime is $49 →",
    bridgeCopy,
    trackEvent: `${eventPrefix}recommended_plan_click`,
  };
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: "Is Part 1 free?",           a: "Yes. Full video, reading, slides, flashcards, and quiz — no signup or payment required." },
  { q: "What happens after I buy?", a: "Immediate access. Set your password, create your profile, and start Part 1 — under 60 seconds." },
  { q: "Can I cancel anytime?",     a: "Yes. Cancel in 2 clicks from your dashboard. No call required." },
  { q: "Is there a refund?",        a: "Yes — 7-day clarity guarantee. If the course doesn't feel right, email us for a full refund. No questions asked." },
  { q: "Can my family use it?",     a: "Yes. The family plan includes up to 5 separate learner profiles, each tracking their own progress." },
  { q: "Can I use it on mobile?",   a: "Yes. Works on phone, tablet, and desktop. Many students learn during commutes or before bed." },
];

// ── Score Gauge ───────────────────────────────────────────────────────────────
// Needle uses SVG `transform` attribute (not CSS transform) so rotation pivots
// correctly in SVG user-units regardless of how the SVG scales on screen.

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeOutSpring(t: number) {
  const c1 = 0.8, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function ScoreGauge({ score, resultType, name }: { score: number; resultType: ResultType; name: string }) {
  const [animScore, setAnimScore] = useState(0);
  const [needleVal, setNeedleVal] = useState(0);
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
        setNeedleVal(spring * score);
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

  const cx = 160, cy = 155, r = 118;
  const arcLen = Math.PI * r;
  const needleAngle = -90 + (needleVal / 100) * 180;
  const fillOffset  = arcLen - (arcLen * animScore / 100);
  const countNum    = Math.round(animScore);

  function arcPt(pct: number) {
    const a = (180 - pct * 1.8) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  }
  const t39 = arcPt(39);
  const t70 = arcPt(70);
  const result = RESULT_COPY[resultType];

  return (
    <div className="w-full">
      <svg viewBox="0 -16 320 216" className="w-full max-w-[270px] sm:max-w-none mx-auto" aria-hidden>
        <defs>
          <linearGradient id="sg-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ef4444" />
            <stop offset="38%"  stopColor="#f97316" />
            <stop offset="69%"  stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="24" strokeLinecap="round" />
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="url(#sg-gauge-grad)" strokeWidth="24" strokeLinecap="round"
          opacity="0.18" />
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="url(#sg-gauge-grad)" strokeWidth="24" strokeLinecap="round"
          strokeDasharray={arcLen} strokeDashoffset={fillOffset} />
        <circle cx={t39.x} cy={t39.y} r="5" fill="#0d0d0d" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        <circle cx={t70.x} cy={t70.y} r="5" fill="#0d0d0d" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        <text x={cx-r+2}  y={cy+24} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="start">Scattered</text>
        <text x={cx}      y={cy-r-10} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="middle">Partial</text>
        <text x={cx+r-2}  y={cy+24} fontSize="11" fill="rgba(255,255,255,0.38)" textAnchor="end">Strong</text>
        <g transform={`rotate(${needleAngle}, ${cx}, ${cy})`}>
          <line x1={cx} y1={cy-16} x2={cx} y2={cy-r+14}
            stroke="rgba(255,255,255,0.88)" strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy-r+14} r="5" fill="white" opacity="0.85" />
          <circle cx={cx} cy={cy} r="12" fill="#0d0d0d" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="4.5" fill="#c8a96e" />
        </g>
      </svg>
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

export function SeerahCheckupClient({
  creator,
  sourceBadge,
  eventPrefix,
  urls,
}: SeerahCheckupClientProps) {
  const watchFreeUrl = urls.watchFree ?? "/watch-free";

  // ── Analytics ──────────────────────────────────────────────────────────────
  function track(event: string, props?: Record<string, unknown>) {
    try {
      if (typeof window === "undefined") return;
      if (process.env.NODE_ENV === "development") console.log(`[${creator}]`, event, props);
      const payload = JSON.stringify({ creator, eventType: event, ...props });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/influencer/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
      }
    } catch { /* never block */ }
  }

  const [phase, setPhase]                   = useState<Phase>("idle");
  const [currentQ, setCurrentQ]             = useState(0);
  const [answers, setAnswers]               = useState<Record<number, number>>({});
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [emailErr, setEmailErr]             = useState("");
  const [faqOpen, setFaqOpen]               = useState<number | null>(null);
  const [showInlinePreview, setShowInline]  = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const quizRef   = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);

  // Fire once on mount — `track` and `eventPrefix` are stable for the
  // lifetime of this page, so the empty dep array is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { track(`${eventPrefix}landing_view`); }, []);

  function startQuiz() {
    track(`${eventPrefix}quiz_start`);
    setPhase("quiz");
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function handleAnswer(optionIndex: number) {
    const q = QUESTIONS[currentQ];
    setSelectedAnswer(optionIndex);
    const updated = { ...answers, [q.id]: optionIndex };
    setAnswers(updated);
    track(`${eventPrefix}quiz_question_answered`, { questionId: q.id, optionIndex });
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => { setSelectedAnswer(null); setCurrentQ(n => n + 1); }, 260);
    } else {
      track(`${eventPrefix}quiz_completed`);
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
    const rec        = getRecommendation(answers, urls, eventPrefix);
    const params     = new URLSearchParams(window.location.search);

    track(`${eventPrefix}email_reveal_submit`);

    fetch("/api/checkup/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || null, email, phone: null, answers, score, resultType,
        recommendedPlan: rec.trackEvent.includes("lifetime")
          ? (answers[10] === 1 || answers[10] === 2 ? "family-lifetime" : "individual-lifetime")
          : (answers[10] === 1 || answers[10] === 2 ? "family-monthly" : "individual-monthly"),
        source: creator,
        utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"), utmContent: params.get("utm_content"),
      }),
    }).catch(() => {});

    track(`${eventPrefix}result_view`, { score, resultType });
    setPhase("result");
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const score      = computeScore(answers);
  const resultType = getResultType(score);
  const result     = RESULT_COPY[resultType];
  const insights   = getInsights(answers);
  const rec        = getRecommendation(answers, urls, eventPrefix);

  // After the email gate, enrich checkout links with the collected email/name
  // so the checkout page can pre-fill and skip asking for them again.
  function withUserParams(url: string): string {
    if (!email) return url;
    const sep = url.includes("?") ? "&" : "?";
    let out = `${url}${sep}email=${encodeURIComponent(email)}`;
    if (name.trim()) out += `&name=${encodeURIComponent(name.trim())}`;
    return out;
  }

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
            <p className="text-sm font-bold text-gold mb-1">{sourceBadge}</p>
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
              <Link href={watchFreeUrl} onClick={() => track(`${eventPrefix}watch_free_click`)}
                className="text-text-muted hover:text-gold underline underline-offset-2 transition-colors">
                Watch Part 1 free first
              </Link>
            </p>

            {/* Result preview card */}
            <div className="mt-10 mx-auto max-w-sm rounded-2xl border border-gold/20 bg-surface p-5 text-left">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Your result will show</p>
              {[
                { label: "Seerah Clarity Score",     value: "0 – 100" },
                { label: "Foundational Knowledge",   value: "How well you know the basics" },
                { label: "Timeline Accuracy",        value: "Can you place events in order?" },
                { label: "Personalised next step",   value: "Based on your answers" },
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
          QUIZ / EMAIL / RESULT
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

        {/* ── EMAIL GATE ── */}
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
            RESULT PAGE
            Order: Score → Recommendation + CTA → Insights → FAQ
        ══════════════════════════════════════════════════════ */}
        {phase === "result" && (
          <div className="pt-5 pb-10 sm:py-10 space-y-6 sm:space-y-8">

            {/* 1. Score card */}
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

            {/* 2. Recommendation card */}
            <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-b from-gold/[0.06] to-surface p-7 sm:p-9 shadow-xl shadow-gold/5">
              <p className="text-xl sm:text-2xl font-bold text-text mb-3">Your Best Next Step</p>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-7">{rec.bridgeCopy}</p>

              {rec.showFreePrimary ? (
                <>
                  <button
                    onClick={() => {
                      track(`${eventPrefix}result_watch_part1_expand`);
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
                      <Link href={withUserParams(rec.secondaryUrl)}
                        onClick={() => track(`${eventPrefix}recommended_plan_click`)}
                        className="block w-full py-4 rounded-xl border-2 border-gold/35 text-gold font-bold text-base text-center hover:border-gold/60 hover:bg-gold/5 transition-colors mb-2">
                        {rec.secondaryLabel}
                      </Link>
                      <p className="text-xs text-center text-text-muted/55 mb-4">Start today. Continue at your own pace.</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href={withUserParams(rec.primaryUrl)}
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
                    <Link href={watchFreeUrl}
                      onClick={() => track(`${eventPrefix}watch_free_click`)}
                      className="text-text-muted hover:text-gold underline underline-offset-2 transition-colors">
                      Watch Part 1 free first
                    </Link>
                  </p>
                  {rec.lifetimeUrl && rec.lifetimeLabel && (
                    <p className="text-sm text-center text-text-muted/55">
                      <Link href={withUserParams(rec.lifetimeUrl)}
                        onClick={() => track(`${eventPrefix}lifetime_click`)}
                        className="underline underline-offset-2 hover:text-text-muted transition-colors">
                        {rec.lifetimeLabel}
                      </Link>
                    </p>
                  )}
                </>
              )}

              <TrustStrip />
            </div>

            {/* Inline Part 1 preview */}
            {showInlinePreview && (
              <div ref={inlineRef} className="scroll-mt-24">
                <InlinePart1Video
                  checkoutUrl={withUserParams(rec.secondaryUrl ?? urls.individualMonthly)}
                  checkoutLabel={rec.secondaryLabel}
                  onVideoStart={() => track(`${eventPrefix}inline_part1_started`)}
                  onUnlockClick={() => track(`${eventPrefix}inline_part1_unlock_click`)}
                />
              </div>
            )}

            {/* 3. Score insights */}
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

      {/* ── Mobile sticky bar ── */}
      {phase === "idle" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-3 py-2.5 flex gap-2">
          <Link href={watchFreeUrl} onClick={() => track(`${eventPrefix}watch_free_click`)}
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
            <button
              onClick={() => {
                track(`${eventPrefix}result_watch_part1_expand`);
                setShowInline(true);
                setTimeout(() => inlineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
              <Play className="w-4 h-4 fill-current" />
              Watch Part 1 Free
            </button>
          ) : rec.showFreePrimary && showInlinePreview ? (
            <Link
              href={withUserParams(rec.secondaryUrl ?? urls.individualMonthly)}
              onClick={() => track(`${eventPrefix}recommended_plan_click`)}
              className="flex w-full items-center justify-center py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20">
              {rec.secondaryUrl?.includes("family") ? "Unlock Family Access — $9.99/mo" : "Unlock Individual Access — $4.99/mo"}
            </Link>
          ) : (
            <Link href={withUserParams(rec.primaryUrl)}
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
