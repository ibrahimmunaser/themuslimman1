import { Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import {
  ArrowRight, Sparkles, Target, Gift, CheckCircle2, ChevronDown,
  Play, Lock, Video, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle, Brain, BookOpen, Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { FadeUp, FloatingGlow, IslamicPatternBackground } from "@/components/motion";

export const metadata = {
  title: "Pricing — Complete Seerah",
  description:
    "Learn the Seerah of the Prophet ﷺ clearly, visually, and in order. Start Part 1 completely free — no account required.",
};

export const dynamic = "force-dynamic";

const WHAT_YOU_GET = [
  {
    icon: <Video className="w-5 h-5" />,
    stat: "✓",
    label: "Video lessons",
    desc: "Follow the Seerah step by step, in chronological order.",
  },
  {
    icon: <Monitor className="w-5 h-5" />,
    stat: "✓",
    label: "Visual slides",
    desc: "Slides that make every lesson easy to follow and remember.",
  },
  {
    icon: <LayoutGrid className="w-5 h-5" />,
    stat: "✓",
    label: "Infographics",
    desc: "Visual summaries that show what words alone can't fully explain.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    stat: "✓",
    label: "Lesson summaries",
    desc: "Written recaps for every part — read at your own pace.",
  },
  {
    icon: <ListChecks className="w-5 h-5" />,
    stat: "✓",
    label: "Key facts",
    desc: "The most important points from each lesson, clearly stated.",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    stat: "✓",
    label: "Mind maps",
    desc: "See how events, people, and themes connect at a glance.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    stat: "✓",
    label: "Flashcards",
    desc: "Quick review tools you can revisit any time.",
  },
  {
    icon: <HelpCircle className="w-5 h-5" />,
    stat: "✓",
    label: "Short quizzes",
    desc: "Checkpoints that help the story stick — no pressure.",
  },
];

const OUTCOMES = [
  {
    icon: <Target className="w-5 h-5" />,
    title: "A clear timeline of the Prophet's ﷺ life",
    desc: "Every event in order, so you can finally see the full picture from beginning to end.",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Context behind every major event",
    desc: "Understand why things happened, what led to them, and their lasting impact.",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Lessons that connect Seerah to real life",
    desc: "Not just history — practical wisdom you can apply today.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "A structured system instead of scattered lectures",
    desc: "No more hunting for content — everything is organized for you.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Confidence explaining Seerah to your family",
    desc: "Feel prepared to teach, share, and discuss the Prophet's ﷺ life with clarity.",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: "The complete story — nothing missing",
    desc: "From pre-Islamic Arabia to the Prophet's ﷺ final days, with no gaps.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What are my options?",
    a: "Individual Membership is $4.99/month — cancel anytime. Family Membership is $9.99/month for up to 5 learner profiles. If you prefer to pay once, individual lifetime is $79 and family lifetime is $149.",
  },
  {
    q: "Can I cancel the monthly plan anytime?",
    a: "Yes. You can cancel your membership at any time from your account billing page. You keep access until the end of the billing period.",
  },
  {
    q: "What does the course include?",
    a: "Every lesson comes with a video, reading, visual slides, flashcards, and a short quiz. You go at your own pace — no deadlines, no pressure.",
  },
  {
    q: "Is there a free option?",
    a: "Yes — Part 1 is completely free with no account required. You can preview it right on this page.",
  },
  {
    q: "What is the 7-Day Clarity Guarantee?",
    a: "If you start the course and feel it isn't what you expected, contact us within 7 days for a full refund — no questions asked.",
  },
  {
    q: "What is the difference between Individual and Family?",
    a: "Individual is for one learner. Family supports up to 5 learner profiles in one household — each with their own independent progress tracking.",
  },
  {
    q: "Will more content be added?",
    a: "Yes. All future content and improvements are included at no extra cost for all members.",
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  let accessInfo: Awaited<ReturnType<typeof getUserAccessInfo>> | null = null;
  if (user) {
    accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
  }

  const hasLifetime = accessInfo?.hasLifetime ?? false;
  const hasMonthly  = !hasLifetime && (accessInfo?.hasActiveSubscription ?? false);
  const hasFamily   = user?.planType === "family";

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />
      <CreatorPromoTracker />

      {/* ════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-16 pb-14 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.02} />
        <FloatingGlow
          className="absolute -top-20 left-1/2 -translate-x-1/2"
          width={700}
          height={400}
          duration={10}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.07) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Start Part 1 completely free
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
              Learn the Seerah of the Prophet{" "}
              <span className="text-gold">ﷺ</span>{" "}
              Clearly, Visually, and in Order
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-4">
              A guided course that takes you through the Prophet&apos;s ﷺ life in order — from before his birth to the final days. Start with Part 1 free.
            </p>
          </FadeUp>

          <FadeUp delay={0.13}>
            <p className="text-sm text-gold font-medium mb-8">
              Start with Part 1 free before getting full access.
            </p>
          </FadeUp>

          <FadeUp delay={0.18}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <Link
                href="/checkout?plan=individual-monthly"
                className={buttonClass("primary", "xl", "shadow-lg shadow-gold/20")}
              >
                Start Learning
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#preview"
                className={buttonClass(
                  "ghost",
                  "xl",
                  "border border-gold/30 text-gold hover:bg-gold/5",
                )}
              >
                <Play className="w-4 h-4" />
                Watch Part 1 Free
              </Link>
            </div>
            <p className="text-xs text-text-muted">
              Cancel anytime ·{" "}
              <Link href="/checkout?plan=individual-lifetime" className="text-gold/70 hover:text-gold transition-colors underline underline-offset-2">
                Prefer to pay once? Lifetime from $79
              </Link>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. WHAT YOU GET INSIDE
      ════════════════════════════════════════ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
                Everything you need — nothing extra to buy
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
                Every lesson comes with a full set of tools to make the story stick — not just a video.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {WHAT_YOU_GET.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl border border-border bg-surface hover:border-gold/25 hover:bg-surface-raised transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center text-gold flex-shrink-0">
                  {card.icon}
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">{card.label}</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. PREVIEW PART 1 FREE
      ════════════════════════════════════════ */}
      <section
        id="preview"
        className="py-16 border-t border-border bg-surface/30 scroll-mt-16"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-5">
                <Play className="w-4 h-4" />
                100% Free · No Signup Required
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
                Preview Part 1 Free
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Watch the first part free before getting full access. See the teaching style,
                structure, visuals, and learning tools before you pay.
              </p>
            </div>
          </FadeUp>

          <Suspense
            fallback={
              <div className="rounded-2xl border border-border bg-surface p-12 text-center">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-secondary text-sm">Loading Part 1 preview…</p>
              </div>
            }
          >
            <Part1FullPreview
              checkoutHref="/checkout?plan=individual-monthly"
              ctaLabel="Continue After Part 1"
            />
          </Suspense>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. PRICING
      ════════════════════════════════════════ */}
      <PricingSection
        hasLifetime={hasLifetime}
        hasMonthly={hasMonthly}
        hasFamily={hasFamily}
      />

      {/* ════════════════════════════════════════
          5. WHY THIS WAS BUILT
      ════════════════════════════════════════ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-5">
                Why This Was Built
              </h2>
              <p className="text-text-secondary leading-relaxed text-sm sm:text-base mb-8 max-w-2xl mx-auto">
                Many Muslims love the Prophet ﷺ, but never had a simple structured way to study
                his life from beginning to end. This course organizes the Seerah into a clear
                visual learning path so families, students, and individuals can learn with structure.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "No scattered clips",
                  desc: "Everything is organized into 100 sequential parts — not random playlist watching.",
                },
                {
                  title: "No confusing order",
                  desc: "The Seerah unfolds chronologically so you always know where you are in the story.",
                },
                {
                  title: "A complete organized path",
                  desc: "From pre-Islamic Arabia to the Prophet's ﷺ final days — nothing missing.",
                },
              ].map((point) => (
                <div
                  key={point.title}
                  className="flex gap-3 p-4 rounded-xl border border-border bg-surface"
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text text-sm mb-1">{point.title}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── What you'll walk away with ───────────────────────────────── */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              What You&apos;ll Walk Away With
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm">
              More than just content — you&apos;ll gain real understanding of the Prophet&apos;s ﷺ life.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {OUTCOMES.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center text-gold">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-text text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <details
                key={q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. FINAL CTA
      ════════════════════════════════════════ */}
      <section className="py-16 border-t border-border bg-gold-bg">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              Start learning the Prophet&apos;s ﷺ life in order.
            </h2>
            <p className="text-sm text-gold/80 mb-6">
              Cancel anytime · Less than a coffee each month
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/checkout?plan=individual-monthly"
                className={buttonClass("primary", "xl", "shadow-lg shadow-gold/25")}
              >
                Start Learning Today
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/checkout?plan=family-monthly"
                className={buttonClass(
                  "ghost",
                  "xl",
                  "border border-gold/30 text-gold hover:bg-gold/5",
                )}
              >
                Family Plan
              </Link>
            </div>
            <p className="text-xs text-text-muted mb-5">
              Prefer to pay once?{" "}
              <a href="#pricing" className="text-gold/70 hover:text-gold underline underline-offset-2 transition-colors">
                View lifetime options →
              </a>
            </p>
            {!accessInfo?.hasAccess && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/gift-checkout"
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-gold transition-colors"
                >
                  <Gift className="w-4 h-4" />
                  Gift This Course
                </Link>
                <span className="hidden sm:block text-border" aria-hidden>
                  |
                </span>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Lock className="w-3 h-3" />
                  7-Day Clarity Guarantee
                </div>
              </div>
            )}
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}
