import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  CheckCircle2,
  Video,
  ChevronDown,
  ArrowRight,
  Lock,
  BookOpen,
  Layers,
  Map,
  Trophy,
} from "lucide-react";
import { FadeUp, StaggerChildren, AnimatedCard, FloatingGlow, IslamicPatternBackground } from "@/components/motion";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { buttonClass } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { getStudentDashboardData } from "@/lib/queries/student";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";

// Must be dynamic so the per-user auth check + redirect runs on every request.
// A cached ISR response would serve the same HTML to everyone and skip the redirect.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Check if user is logged in and get their progress
  let user = null;
  let userProgress = null;

  try {
    user = await getCurrentUser();

    if (user?.studentProfileId) {
      try {
        const dashboardData = await getStudentDashboardData(user.studentProfileId);
        userProgress = dashboardData.recentProgress[0] || null;
      } catch (error) {
        // Silently fail - user experience not affected
        console.error("Failed to fetch user progress:", error);
        userProgress = null;
      }
    }
  } catch (error) {
    // Silently fail - landing page still works for logged-out users
    console.error("Failed to get current user:", error);
    user = null;
  }

  // Must be OUTSIDE the try/catch — Next.js redirect() works by throwing a
  // special error, which the catch block above would silently swallow.
  if (user) {
    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (hasAccess) {
      redirect("/my-courses");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />
      
      {/* Capture ?promo= URL param and persist to localStorage */}
      <CreatorPromoTracker />

      {/* Show verification banner if user is logged in but email not verified */}
      {user && !user.emailVerified && (
        <EmailVerificationBanner email={user.email} />
      )}

      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.025} />
        <FloatingGlow className="absolute -top-20 left-1/2 -translate-x-1/2" width={700} height={400} duration={10} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div
          className="absolute top-20 right-0 w-[400px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(circle at 70% 30%, rgba(200,169,110,0.04) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 2-column on xl+, stacked below */}
          <div className="xl:grid xl:grid-cols-[1fr_420px] xl:gap-16 xl:items-center">

            {/* Left: headline + CTAs */}
            <div className="text-center xl:text-left py-4 xl:py-10">
              <FadeUp delay={0}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-5xl 2xl:text-6xl font-bold tracking-tight leading-tight mb-6">
                  Most Muslims only know fragments of the Seerah.{" "}
                  <span className="text-gradient-gold">Learn it as one connected story.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.1}>
                <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto xl:mx-0 mb-10 leading-relaxed">
                  A guided Seerah course that helps you understand the Prophet&apos;s ﷺ life in order, remember the major events, and explain them with confidence.
                </p>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-8">
                  <Link
                    href="#preview"
                    className={buttonClass("primary", "xl", "shadow-2xl shadow-gold/20")}
                  >
                    Start Free Preview
                  </Link>
                  <Link
                    href="#pricing"
                    className={buttonClass("secondary", "xl")}
                  >
                    View Pricing
                  </Link>
                </div>
              </FadeUp>

              {/* Trust pills — xl+ only */}
              <FadeUp delay={0.3}>
                <div className="hidden xl:flex items-center gap-3 flex-wrap text-xs text-text-muted/70">
                  <span>100 parts</span>
                  <span aria-hidden>·</span>
                  <span>7 chronological stages</span>
                  <span aria-hidden>·</span>
                  <span>Video, quiz, flashcard, mind map</span>
                </div>
              </FadeUp>
            </div>

            {/* Right: product visual — xl+ only */}
            <div className="hidden xl:block">
              {user && userProgress ? (
                /* Dashboard progress card for logged-in users */
                <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/40">
                  <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-text-muted ml-1">themuslimman.com/seerah</span>
                  </div>
                  <div className="bg-surface-raised p-6">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Continue where you left off</p>
                    <h3 className="text-text font-semibold mb-4">
                      Part {userProgress.classCourseItem.seerahPart?.partNumber}: {userProgress.classCourseItem.seerahPart?.title || ""}
                    </h3>
                    <div className="w-full bg-surface rounded-full h-1.5 mb-2">
                      <div
                        className="bg-gold h-1.5 rounded-full"
                        style={{ width: `${userProgress.completionPercentage || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted">{userProgress.completionPercentage || 0}% complete</p>
                  </div>
                </div>
              ) : (
                /* Feature stat cards for visitors */
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 1 — 100 Lessons */}
                  <div className="bg-surface border border-border/60 rounded-2xl p-5 flex flex-col gap-4 hover:border-gold/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <Video className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-text leading-none mb-1">100</div>
                      <div className="text-sm font-semibold text-text-secondary mb-2">Video Lessons</div>
                      <p className="text-xs text-text-muted leading-relaxed">Full chronological coverage from birth to passing ﷺ</p>
                    </div>
                  </div>

                  {/* Card 2 — 7 Eras */}
                  <div className="bg-surface border border-border/60 rounded-2xl p-5 flex flex-col gap-4 hover:border-gold/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <Map className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-text leading-none mb-1">7</div>
                      <div className="text-sm font-semibold text-text-secondary mb-2">Chronological Eras</div>
                      <p className="text-xs text-text-muted leading-relaxed">Structured stages so context and sequence are never lost</p>
                    </div>
                  </div>

                  {/* Card 3 — 8 Formats */}
                  <div className="bg-surface border border-border/60 rounded-2xl p-5 flex flex-col gap-4 hover:border-gold/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <Layers className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-text leading-none mb-1">8</div>
                      <div className="text-sm font-semibold text-text-secondary mb-2">Study Formats</div>
                      <p className="text-xs text-text-muted leading-relaxed">Video, audio, slides, mindmaps, flashcards, quizzes &amp; more</p>
                    </div>
                  </div>

                  {/* Card 4 — Progress tracking */}
                  <div className="bg-surface border border-border/60 rounded-2xl p-5 flex flex-col gap-4 hover:border-gold/30 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <Trophy className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-text leading-none mb-1">1×</div>
                      <div className="text-sm font-semibold text-text-secondary mb-2">Lifetime Access</div>
                      <p className="text-xs text-text-muted leading-relaxed">Pay once, keep access forever — no recurring fees</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard preview for mobile/tablet (xl: hidden since shown in right column above) */}
        {user && userProgress && (
          <div className="xl:hidden relative max-w-5xl mx-auto px-4 sm:px-6 mt-10">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/50">
              <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-text-muted">themuslimman.com/seerah</span>
                </div>
              </div>
              <div className="bg-surface-raised p-6 md:p-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">Continue where you left off</p>
                      <h3 className="text-text font-semibold mt-1">
                        Part {userProgress.classCourseItem.seerahPart?.partNumber}: {userProgress.classCourseItem.seerahPart?.title || ""}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                      <Video className="w-4 h-4 text-gold" />
                    </div>
                  </div>
                  <div className="w-full bg-surface rounded-full h-1.5">
                    <div
                      className="bg-gold h-1.5 rounded-full"
                      style={{ width: `${userProgress.completionPercentage || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-muted">
                    {userProgress.completionPercentage || 0}% complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sticky CTA strip — sticks after user scrolls past hero */}
      {!user && (
        <div className="sticky top-16 sm:top-20 z-40 bg-ink border-b border-border/60 hidden sm:block">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-text-secondary truncate hidden md:block">
              Complete Seerah — 100 parts, all formats included
            </p>
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <span className="text-xs text-text-muted hidden lg:block">Instant access · Lifetime option available</span>
              <Link
                href="/signup-checkout?plan=complete"
                className="inline-flex items-center gap-2 px-4 py-1.5 min-h-[36px] bg-gold hover:bg-gold-light text-ink text-xs font-semibold rounded-lg transition-colors"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          PREVIEW BEFORE BUYING
      ============================================ */}
      <section id="preview" className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-10">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
              Experience Part 1 For Free
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              The Complete Part 1 — Right Here, Right Now
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              No signup. No trial. No limits. This is the exact same quality and format you&apos;ll get with all 100 parts. Watch the video, read the briefing, explore the study guide, view the mindmap — everything.
            </p>
          </FadeUp>

          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden" style={{ minHeight: 580 }}>
              {/* Tab bar skeleton */}
              <div className="h-14 bg-surface border-b border-border flex items-center gap-2 px-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-8 w-20 rounded-lg bg-surface-raised" />
                ))}
              </div>
              {/* Content skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-5 bg-surface-raised rounded w-2/3" />
                <div className="h-4 bg-surface-raised rounded w-1/2" />
                <div className="h-4 bg-surface-raised rounded w-3/4" />
                <div className="mt-6 aspect-video bg-surface-raised rounded-xl" />
              </div>
            </div>
          }>
            <Part1FullPreview />
          </Suspense>
        </div>
      </section>

      {/* ============================================
          WHY SCATTERED VIDEOS DON'T WORK
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why scattered videos don&apos;t work
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Most Seerah content gives you isolated stories. This course gives you the full timeline. You do not just learn what happened. You learn what came before, what came after, and why each event mattered.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT'S INCLUDED
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              You are getting the full Seerah.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              One complete package. The full 100-part story, with everything you need to learn, review, and retain it.
            </p>
          </FadeUp>
          <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto" stagger={0.07}>
            {[
              { label: "All 100 video lessons" },
              { label: "Summaries and briefings" },
              { label: "Quizzes" },
              { label: "Flashcards" },
              { label: "Mind maps" },
              { label: "Visual learning resources" },
              { label: "Study guides and reports" },
              { label: "Guided progress tracking" },
              { label: "Lifetime access" },
            ].map(({ label }) => (
              <AnimatedCard key={label} lift className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm text-text">{label}</span>
              </AnimatedCard>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ============================================
          PRICING
      ============================================ */}
      <PricingSection
        hasLifetime={!!(user?.hasPaid)}
        hasMonthly={false}
        hasFamily={user?.planType === "family"}
        isLoggedIn={!!user}
      />

      {/* ============================================
          PARENT ACCOUNTABILITY
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              For parents: know your child is actually learning
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Weekly parent progress reports help you see whether your child is watching, reading, and moving forward.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Progress Reports */}
            <AnimatedCard delay={0} lift className="p-6 rounded-xl border border-border bg-surface">
              <h3 className="font-bold text-text mb-4">Progress Reports Include:</h3>
              <ul className="space-y-2.5">
                {[
                  "Lessons watched",
                  "Briefings read",
                  "Study time",
                  "Current lesson",
                  "Recommended next step",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedCard>

            {/* Advanced Reports */}
            <AnimatedCard delay={0.1} lift className="p-6 rounded-xl border-2 border-gold/30 bg-gold/5">
              <h3 className="font-bold text-gold mb-4">Reports Also Include:</h3>
              <ul className="space-y-2.5">
                {[
                  "Quiz scores",
                  "Flashcard activity",
                  "Weak areas",
                  "Strong areas",
                  "Mastery progress",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* ============================================
          7-DAY CLARITY GUARANTEE
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <FadeUp className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            7-Day Clarity Guarantee
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
            Try the course for 7 days. If you do not feel the Seerah is becoming clearer and more connected, email us for a refund.
          </p>
        </FadeUp>
      </section>

      {/* ============================================
          WHAT HAPPENS AFTER YOU BUY
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              What happens after you buy?
            </h2>
          </div>

          <StaggerChildren className="space-y-4 mb-8" stagger={0.08}>
            {[
              { step: "1", text: "Create your student account" },
              { step: "2", text: "Start with Part 1" },
              { step: "3", text: "Watch the video lesson" },
              { step: "4", text: "Complete the quiz" },
              { step: "5", text: "Unlock the next lesson" },
              { step: "6", text: "Track your progress as you move through the Seerah" },
            ].map((item) => (
              <AnimatedCard
                key={item.step}
                lift
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                  <span className="text-gold font-bold">{item.step}</span>
                </div>
                <p className="text-text">{item.text}</p>
              </AnimatedCard>
            ))}
          </StaggerChildren>

          <div className="p-5 rounded-xl border border-gold/20 bg-gold-bg text-center">
            <p className="text-text-secondary leading-relaxed">
              <span className="text-text font-medium">For Complete students:</span> You also get mind maps, flashcards, briefings, facts, slides, and infographics for deeper review and teaching.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT YOU GET IN COMPLETE
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The extra tools are built to help students remember, not overwhelm them.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: "🗂️", title: "Flashcards for review", desc: "Quick recall practice for names, dates, and key events" },
              { icon: "📝", title: "Quizzes for recall", desc: "Test your understanding and track mastery" },
              { icon: "🗺️", title: "Mind maps for structure", desc: "See connections and the big picture" },
              { icon: "📊", title: "Slides and infographics", desc: "Visual learning and teaching tools" },
              { icon: "📧", title: "Parent reports", desc: "Weekly progress updates for accountability" },
              { icon: "📖", title: "Study guides", desc: "Comprehensive review materials" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-text text-sm mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary/80 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
      ============================================ */}
      <TestimonialsSection />

      {/* ============================================
          FAQ
      ============================================ */}
      <section id="faq" className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2">
            {[
              {
                q: "What does Complete Seerah include?",
                a: "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking.",
              },
              {
                q: "Is there only one plan?",
                a: "Yes. We offer two options: Monthly Access at $9/month (cancel anytime) or Lifetime Access for a one-time $99 payment. Both give full access from day one.",
              },
              {
                q: "Is the course self-paced?",
                a: "Yes. You can learn at your own pace. Your progress is tracked, and you can continue where you left off at any time.",
              },
              {
                q: "Can I access any part in any order?",
                a: "Yes. Once you purchase, you can open any of the 100 parts directly. Progress tracking is a guide, not a gate.",
              },
              {
                q: "Do I get lifetime access?",
                a: "With the lifetime plan, yes — one-time payment, own it for life, no recurring charges. We also offer a $9/month subscription if you prefer to start with a lower upfront cost.",
              },
              {
                q: "Is this suitable for parents and teachers?",
                a: "Yes. The course includes slides, infographics, briefings, and mind maps designed for teaching your children, halaqah lessons, or classroom use.",
              },
              {
                q: "What is included in the free preview?",
                a: "You can access the complete Part 1 for free — including the video, briefing, study guide, mind map, and all other materials — before purchasing.",
              },
              {
                q: "What if I do not feel the course helps me?",
                a: "We offer a 7-Day Clarity Guarantee. If you do not feel the Seerah is becoming clearer and more connected, email us within 7 days for a full refund.",
              },
            ].map((item, i) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none rounded-xl font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
      ============================================ */}
      <section className="py-20 md:py-28 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Do not spend another year knowing scattered stories.
          </h2>
          <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
            Start understanding the Seerah as one connected journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="#preview"
              className={buttonClass("primary", "xl", "shadow-2xl shadow-gold/20")}
            >
              Start Free Preview
            </Link>
            <Link
              href="/signup-checkout?plan=complete"
              className={buttonClass("secondary", "xl")}
            >
              Unlock Complete Seerah
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure Payment</span>
            <span>·</span>
            <span>Instant Access</span>
            <span>·</span>
            <span>Own It Forever</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
