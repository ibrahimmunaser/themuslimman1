import Link from "next/link";
import { Suspense } from "react";
import {
  CheckCircle2,
  Video,
  Headphones,
  FileText,
  Map,
  Image,
  Layers,
  BookOpen,
  ChevronRight,
  Star,
  ArrowRight,
  Lock,
  Zap,
  LayoutDashboard,
  CircleCheck,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/queries/student";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";

// Revalidate every 60 seconds to reduce database load
export const revalidate = 60;

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

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />
      
      {/* Show verification banner if user is logged in but email not verified */}
      {user && !user.emailVerified && (
        <EmailVerificationBanner email={user.email} />
      )}

      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Most Muslims only know fragments of the Seerah.
            <br />
            <span className="text-gradient-gold">Learn it as one connected story.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A guided Seerah course that helps you understand the Prophet's ﷺ life in order, remember the major events, and explain them with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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
        </div>

        {/* Dashboard preview - only show for logged-in users with progress */}
        {user && userProgress && (
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 mt-16">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/50">
              <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-text-muted">themuslimman.com/dashboard</span>
                </div>
              </div>
              <div className="bg-surface-raised p-6 md:p-8">
                <div className="flex flex-col gap-4">
                  {/* User's actual progress */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">Continue where you left off</p>
                      <h3 className="text-text font-semibold mt-1">
                        Part {userProgress.classCourseItem.seerahPart?.partNumber}: {userProgress.classCourseItem.seerahPart?.title || "Loading..."}
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

      {/* ============================================
          WHY THIS IS DIFFERENT
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why this works better than scattered videos
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Most Seerah content gives you isolated stories. This course gives you the full timeline. You do not just learn what happened. You learn what came before, what came after, and why each event mattered.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          ESSENTIALS IS NOT A DEMO
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Essentials is not a demo.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Essentials gives you the complete Seerah story in 75 guided lessons. You can understand the life of the Prophet ﷺ from beginning to end with Essentials alone. Complete Seerah is for students who want the full mastery system with expanded lessons, mind maps, flashcards, briefings, facts, slides, and infographics.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          WHICH PLAN SHOULD I CHOOSE
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Which plan should I choose?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Essentials */}
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <h3 className="text-xl font-bold text-text mb-4">Choose Essentials if:</h3>
              <ul className="space-y-3">
                {[
                  "You want the complete story",
                  "You want video lessons and quizzes",
                  "You want a simple guided path",
                  "You are mainly learning for yourself",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-text-secondary">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Complete Seerah */}
            <div className="p-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface gold-glow">
              <h3 className="text-xl font-bold text-text mb-4">Choose Complete if:</h3>
              <ul className="space-y-3">
                {[
                  "You want to remember what you study",
                  "You want mind maps and flashcards",
                  "You want deeper context",
                  "You want to teach your family, children, students, or halaqah",
                  "You want the full 100-part system",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-text">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PREVIEW BEFORE BUYING
      ============================================ */}
      <section id="preview" className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
              Experience Part 1 For Free
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              The Complete Part 1 — Right Here, Right Now
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              No signup. No trial. No limits. This is the exact same quality and format you'll get with all 100+ parts. Watch the video, read the briefing, explore the study guide, view the mindmap — everything.
            </p>
          </div>

          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-text-secondary">Loading Part 1 preview...</p>
            </div>
          }>
            <Part1FullPreview />
          </Suspense>
        </div>
      </section>

      {/* ============================================
          PRICING
      ============================================ */}
      <section id="pricing" className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Choose Your Plan
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              One-time payment. Own it for life. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Essentials */}
            <div className="relative p-6 rounded-2xl border border-border bg-surface flex flex-col">
              <div className="mb-5">
                <p className="text-text text-sm font-medium mb-1">Essentials Seerah</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-text">$49</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "75 guided lessons",
                  "Complete narrative path",
                  "Video lessons",
                  "Quizzes",
                  "Progress tracking",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup-checkout?plan=essentials"
                className={buttonClass("outline", "lg", "w-full justify-center")}
              >
                Start Essentials
              </Link>
            </div>

            {/* Complete Seerah — BEST VALUE */}
            <div className="relative p-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold uppercase tracking-wide shadow-lg">
                Best Value
              </div>
              
              <div className="mb-5">
                <p className="text-gold text-sm font-medium mb-1">Complete Seerah</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-text">$79</span>
                  <span className="text-text-muted text-sm">Founding Member Price</span>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Regular price $129 · Available for the first 500 students
                </p>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "All 100 parts",
                  "Everything in Essentials",
                  "25 expanded lessons",
                  "Mind maps",
                  "Flashcards",
                  "Briefings + Facts",
                  "Slides + Infographics",
                  "Teaching and review tools",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup-checkout?plan=complete"
                className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
              >
                Unlock Complete Seerah
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-xs text-text-muted mt-3">
                Only $30 more than Essentials.
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-text-muted mb-2">
              <Lock className="w-4 h-4" />
              <span>Secure payment · Instant access · Own it for life</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOUNDING MEMBER URGENCY
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-2xl border-2 border-gold/30 bg-gradient-to-b from-gold/10 to-surface text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Founding Member Price
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6 max-w-xl mx-auto">
              Complete Seerah is currently available for $79 for the first 500 students. Regular price: $129. Founding Members get early access pricing while helping us improve the course experience before the full public release.
            </p>
            <Link
              href="/signup-checkout?plan=complete"
              className={buttonClass("primary", "xl", "shadow-lg shadow-gold/25")}
            >
              Become a Founding Member
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          7-DAY CLARITY GUARANTEE
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            7-Day Clarity Guarantee
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
            Try the course for 7 days. If you do not feel the Seerah is becoming clearer and more connected, email us for a refund.
          </p>
        </div>
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

          <div className="space-y-4 mb-8">
            {[
              { step: "1", text: "Create your student account" },
              { step: "2", text: "Start with Part 1" },
              { step: "3", text: "Watch the video lesson" },
              { step: "4", text: "Complete the quiz" },
              { step: "5", text: "Unlock the next lesson" },
              { step: "6", text: "Track your progress as you move through the Seerah" },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                  <span className="text-gold font-bold">{item.step}</span>
                </div>
                <p className="text-text">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border border-gold/20 bg-gold-bg text-center">
            <p className="text-text-secondary leading-relaxed">
              <span className="text-text font-medium">For Complete students:</span> You also get mind maps, flashcards, briefings, facts, slides, and infographics for deeper review and teaching.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SHORTCUTS TO MASTERY
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The extra resources are not extra work.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              They are shortcuts. Use the video to learn. Use the briefing to review. Use the mind map to connect events. Use the flashcards to remember names and details. Use the quiz to test yourself. Use the slides and infographics to teach others.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          BUILT FOR MORE THAN PRIVATE STUDY
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for more than private study
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Use Complete Seerah to teach your children, prepare halaqah lessons, review before a class, explain major events clearly, and keep the timeline straight.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SOCIAL PROOF
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for serious learners.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Built from a 100-part structured Seerah curriculum and designed for students, parents, teachers, and serious learners who want clarity, retention, and structure.
          </p>
        </div>
      </section>

      {/* ============================================
          FAQ
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is the difference between Essentials and Complete Seerah?",
                a: "Essentials is a complete 75-lesson narrative path through the Seerah. Complete Seerah includes the full 100-part mastery system with expanded lessons, review tools, and teaching assets.",
              },
              {
                q: "Is Essentials a complete course?",
                a: "Yes. Essentials gives you the complete Seerah story in 75 guided lessons. You can understand the life of the Prophet ﷺ from beginning to end with Essentials alone.",
              },
              {
                q: "Can I upgrade later?",
                a: "Yes. Essentials students can upgrade to Complete later and only pay the difference.",
              },
              {
                q: "Do I only pay the difference if I upgrade?",
                a: "Yes. If you own Essentials ($49) and want to upgrade to Complete, you only pay $30 more.",
              },
              {
                q: "Is the course self-paced?",
                a: "Yes. You can learn at your own pace. Your progress is tracked, and you can continue where you left off at any time.",
              },
              {
                q: "Do I get lifetime access?",
                a: "Yes. One-time payment. Own it for life. No subscriptions.",
              },
              {
                q: "Is this suitable for parents and teachers?",
                a: "Yes. Complete Seerah includes slides, infographics, briefings, and mind maps designed for teaching your children, halaqah lessons, or classroom use.",
              },
              {
                q: "What is included in the free preview?",
                a: "You can access the complete Part 1 for free — including the video, briefing, study guide, mind map, and all other materials — before purchasing.",
              },
              {
                q: "What if I do not feel the course helps me?",
                a: "We offer a 7-day refund guarantee. If you do not feel the Seerah is becoming clearer and more connected, email us for a refund.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="p-5 rounded-xl border border-border bg-surface"
              >
                <h3 className="font-semibold text-text mb-2">{item.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
              </div>
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
