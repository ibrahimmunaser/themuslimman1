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

      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="gold" size="md" className="mb-6">
            Not a course. A complete Seerah system.
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Most Muslims Only Know
            <br />
            <span className="text-gradient-gold">Fragments of the Seerah.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Now understand the full journey clearly.
            <br />
            This is the first complete system that lets you follow the life of the Prophet ﷺ step-by-step, with full context and clarity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/signup-checkout?plan=complete"
              className={buttonClass("primary", "xl", "shadow-2xl shadow-gold/20")}
            >
              Own Complete Academy
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#what-you-get"
              className={buttonClass("secondary", "xl")}
            >
              View What's Included
            </Link>
          </div>

          <p className="text-sm text-text-muted">
            Built as a complete 100-part Seerah system — not random lectures
          </p>
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
          PREVIEW BEFORE BUYING
      ============================================ */}
      <section className="py-16 border-t border-border">
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
          PRICING (DIRECTLY AFTER HERO)
      ============================================ */}
      <section id="pricing" className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
              Start Today
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Choose Your Plan
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              One-time payment. Own it for life. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Starter */}
            <div className="relative p-6 rounded-2xl border border-border bg-surface flex flex-col">
              <div className="mb-5">
                <p className="text-text-muted text-sm font-medium mb-1">Seerah Starter</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-text">$49</span>
                </div>
                <p className="text-xs text-success font-medium mb-2">
                  One dinner out costs more than this.
                </p>
                <p className="text-xs text-text-muted italic">
                  Starter is for people who want a limited preview, not the complete journey.
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Limited parts only (not full journey)",
                  "Basic summaries only",
                  "No deep dives",
                  "No complete structure",
                  "Good for quick overview only",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-muted">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <p className="text-xs text-center text-orange-400 font-medium">
                  ⚠️ This is NOT the complete Seerah experience.
                </p>
                <Link
                  href="/signup-checkout?plan=essentials"
                  className={buttonClass("outline", "lg", "w-full justify-center")}
                >
                  Start with Starter
                </Link>
                <p className="text-xs text-center text-text-muted">
                  You can upgrade to Complete later.
                </p>
              </div>
            </div>

            {/* Complete — HERO option */}
            <div className="relative p-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold uppercase tracking-wide shadow-lg">
                Recommended
              </div>
              
              <div className="mb-5">
                <p className="text-gold text-sm font-medium mb-1">Complete Seerah Academy</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-text">$79</span>
                  <span className="text-text-muted text-sm line-through">$199</span>
                </div>
                <div className="space-y-1 mb-2">
                  <p className="text-xs text-success font-medium">
                    Less than $0.80 per Seerah part · Own it for life
                  </p>
                  <p className="text-xs text-gold">
                    One textbook can cost more than this full system
                  </p>
                </div>
                <p className="text-xs text-text-secondary italic">
                  For those who want to actually understand the Seerah — not just hear it.
                </p>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {[
                  "Own the full 100+ part structured Seerah journey for life",
                  "Understand every major event with proper context",
                  "Step-by-step chronological clarity",
                  "Videos, audio, slides, summaries, mindmaps, quizzes, study guides",
                  "Use for yourself, your children, or family study nights",
                  "Qur'an and hadith connections where directly relevant",
                  "Built as a complete learning system — not scattered lectures",
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
                Own Complete Academy
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-xs text-text-muted mt-3">
                Most students choose Complete for the full experience
              </p>
            </div>
          </div>

          {/* Why Now - Urgency */}
          <div className="mb-8 p-4 rounded-xl border border-gold/20 bg-gold-bg text-center">
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-semibold text-text">Early access pricing is temporary</span> because the platform is still expanding. As more lessons, quizzes, and features are added, the price may increase.
            </p>
          </div>

          {/* Mini FAQ - Friction Killers */}
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { q: "Is this lifetime access?", a: "Yes." },
              { q: "Is this a subscription?", a: "No." },
              { q: "Can I upgrade later?", a: "Yes." },
              { q: "Do I get instant access?", a: "Yes." },
              { q: "Can I use it with my family?", a: "Yes." },
              { q: "7-day refund guarantee?", a: "Yes." },
            ].map((item) => (
              <div key={item.q} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                <span className="text-sm text-text-secondary">{item.q}</span>
                <span className="text-sm font-semibold text-gold">{item.a}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-text-muted mb-2">
              <Lock className="w-4 h-4" />
              <span>Secure payment · Instant access · Own it for life</span>
            </div>
            <p className="text-xs text-success">
              7-day refund guarantee. If it's not what you expected, email us.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          THE PROBLEM
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              You know fragments of the Seerah.
              <br />
              <span className="text-text-secondary">Not the full picture.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              {
                icon: "🧩",
                title: "Scattered Knowledge",
                desc: "You know a story here, a name there — but the full timeline has never been clear.",
              },
              {
                icon: "📂",
                title: "Content Everywhere",
                desc: "YouTube lectures, PDFs, WhatsApp clips. Nothing is organized.",
              },
              {
                icon: "😶",
                title: "No Clear Starting Point",
                desc: "You want to learn properly, but you don't know where to begin.",
              },
              {
                icon: "⏳",
                title: "Starting Over, Again",
                desc: "You've started before. Life interrupts. You lose your place and restart.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border border-gold/20 bg-gold-bg text-center">
            <p className="text-text-secondary leading-relaxed">
              The Seerah is the most important biography ever written — <span className="text-text font-medium">the life of the final Prophet ﷺ.</span> You deserve to know it completely, clearly, and in order.
            </p>
          </div>

          {/* Loss Aversion */}
          <div className="mt-6 p-5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-center">
            <p className="text-text-secondary leading-relaxed">
              <span className="text-orange-400 font-medium">If you keep learning Seerah through scattered clips</span>, you'll keep remembering pieces but missing the full journey.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          WHO THIS IS FOR / NOT FOR
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Is This Right For You?
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              This system is built for serious learners. Not everyone will benefit equally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* This is for you */}
            <div className="p-6 rounded-2xl border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-4">
                <CircleCheck className="w-6 h-6 text-success" />
                <h3 className="text-lg font-bold text-text">This is for you if:</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "You want the Seerah in order",
                  "You're tired of scattered lectures",
                  "You want to teach your family",
                  "You want visuals, quizzes, and summaries",
                  "You prefer structured study over random clips",
                  "You want to understand context, not just stories",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* This is NOT for you */}
            <div className="p-6 rounded-2xl border border-orange-500/30 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <span className="text-orange-400 text-lg font-bold">✕</span>
                </div>
                <h3 className="text-lg font-bold text-text">This is NOT for you if:</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "You only want entertainment",
                  "You don't want structured study",
                  "You want random short clips only",
                  "You're not ready to commit to learning",
                  "You prefer quick highlights over depth",
                  "You're not interested in understanding context",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-xs">✕</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center p-5 rounded-xl border border-gold/20 bg-gold-bg">
            <p className="text-text font-medium">
              This system rewards serious learners who want to truly understand the Prophet's ﷺ life.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          THE SOLUTION
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              The Complete Seerah Academy
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              One complete system that takes you through the full life of the Prophet ﷺ — from pre-Islamic Arabia to his final days — with nothing missing and nothing out of order.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: <LayoutDashboard className="w-6 h-6 text-gold" />,
                title: "Perfectly Organized",
                desc: "100+ parts arranged chronologically so you always know where you are and where to go next.",
              },
              {
                icon: <Layers className="w-6 h-6 text-gold" />,
                title: "Multiple Formats",
                desc: "Video, audio, briefings, mindmaps, infographics, study guides — everything you need to understand and retain.",
              },
              {
                icon: <Zap className="w-6 h-6 text-gold" />,
                title: "Built for Clarity",
                desc: "No confusion. No hunting. Just open your part and everything is right there.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl border border-border bg-surface hover:border-gold/25 transition-all hover:gold-glow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-text text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* The journey visualization */}
          <div className="p-6 md:p-8 rounded-2xl border border-border bg-surface">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Your Journey Through the Seerah</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Pre-Islamic Arabia",
                "Birth & Early Life",
                "The Revelation Begins",
                "Makkah Persecution",
                "The Hijrah",
                "Madinah Period",
                "Major Campaigns",
                "Final Years & Legacy",
              ].map((era, i) => (
                <div key={era} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-text-secondary font-medium">
                    {era}
                  </span>
                  {i < 7 && (
                    <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT YOU GET
      ============================================ */}
      <section id="what-you-get" className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              One System. Every Format.
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Every part comes with everything you need to understand, retain, and connect the dots.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: <Video className="w-5 h-5" />,
                title: "Video Lessons",
                desc: "Clear, structured videos so you can see and hear every part at your own pace.",
              },
              {
                icon: <Headphones className="w-5 h-5" />,
                title: "Audio Versions",
                desc: "Listen during commutes or reflection time — every lesson available as audio.",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Briefing Documents",
                desc: "Read summaries that help you remember what matters most from each part.",
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                title: "Study Guides",
                desc: "Deepen your understanding with guided questions that help you reflect and retain.",
              },
              {
                icon: <Map className="w-5 h-5" />,
                title: "Mind Maps",
                desc: "See the big picture with visual maps of people, events, and connections.",
              },
              {
                icon: <Image className="w-5 h-5" />,
                title: "Infographics",
                desc: "Multiple visual styles so you can remember the timeline and key details clearly.",
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: "Slide Decks",
                desc: "Full presentation slides for teaching, studying, or sharing with family.",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Source Materials",
                desc: "Access classical scholarship and source documents for deeper learning.",
              },
              {
                icon: <Star className="w-5 h-5" />,
                title: "100+ Parts",
                desc: "The complete Seerah from pre-Islamic Arabia to the Prophet's ﷺ final days — nothing missing.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center flex-shrink-0 text-gold group-hover:bg-gold/20 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center p-5 rounded-xl border border-gold/20 bg-gold-bg">
            <p className="text-gold font-semibold mb-1">All connected. All in one place.</p>
            <p className="text-text-secondary text-sm">
              Open any part, and everything you need is already there — organized, formatted, and ready.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          MID-PAGE CONVERSION
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-text mb-6 leading-tight">
            If you've ever felt like you don't fully understand the Seerah —
            <br />
            <span className="text-gradient-gold">this is where that changes.</span>
          </p>
          <Link
            href="/signup-checkout?plan=complete"
            className={buttonClass("primary", "xl", "shadow-2xl shadow-gold/25")}
          >
            Own Complete Academy
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ============================================
          HOW IT FEELS TO USE
      ============================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Built for clarity and ease.
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              No overwhelm. Just open your next part and go.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {[
                {
                  step: "01",
                  title: "Start from Part 1",
                  desc: "Every part builds on the previous one — follow in order or revisit anytime.",
                },
                {
                  step: "02",
                  title: "Watch, Listen, or Read",
                  desc: "Choose how you engage. Watch the video, listen on the go, or read the briefing.",
                },
                {
                  step: "03",
                  title: "Go Deeper When You Want",
                  desc: "Mindmaps, infographics, slides, and source materials — available when you want more.",
                },
                {
                  step: "04",
                  title: "Continue Where You Left Off",
                  desc: "Your progress is tracked. Pick up exactly where you stopped.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <span className="text-gold text-xs font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <p className="text-xs text-text-muted">Part 15</p>
                  <p className="font-semibold text-text">The First Revelation</p>
                </div>
                <Badge variant="gold" size="sm">Now Playing</Badge>
              </div>

              <div className="aspect-video rounded-xl bg-ink border border-border flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto mb-2">
                    <Video className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-xs text-text-muted">Video Player</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {["Briefing", "Study Guide", "Mindmap", "Slides", "More"].map((tab) => (
                  <span
                    key={tab}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      tab === "Briefing"
                        ? "bg-gold/15 text-gold border border-gold/25"
                        : "bg-surface-raised text-text-muted border border-border hover:text-text-secondary"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <div className="bg-surface-raised rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Briefing</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  The night that changed the world. Angel Jibreel appears to the Prophet ﷺ
                  in Cave Hira and delivers the first verses of the Quran...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
      ============================================ */}
      <TestimonialsSection />

      {/* ============================================
          URGENCY
      ============================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Early access pricing is temporary.
          </h2>
          <p className="text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
            The Complete Seerah Academy is currently at its launch price. This will not remain at $79 as more content is added. If you're ready, now is the right time.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "📖",
                title: "Limited Early Access",
                desc: "Lowest price the system will ever be.",
              },
              {
                icon: "📈",
                title: "Price Will Increase",
                desc: "As content and value grows, so will the price.",
              },
              {
                icon: "✅",
                title: "Locked In Forever",
                desc: "All future additions are yours at no extra cost.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl border border-border bg-surface text-left"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h3 className="font-semibold text-text text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
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
            Finally understand the life of the
            <br />
            <span className="text-gradient-gold">Prophet ﷺ completely.</span>
          </h2>
          <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
            Get the Complete Seerah Academy and see the full story — clearly, completely, and in the right order.
          </p>

          <Link
            href="/signup-checkout?plan=complete"
            className={buttonClass("primary", "xl", "shadow-2xl shadow-gold/25 mx-auto")}
          >
            Own Complete Academy
            <ArrowRight className="w-5 h-5" />
          </Link>

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
