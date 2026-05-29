import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Check, LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

export const metadata: Metadata = {
  title: "Get Started | Complete Seerah",
  description: "Begin your structured journey through the life of the Prophet ﷺ with 100 parts — video, audio, reading, quizzes, and more.",
};

interface GetStartedPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function GetStartedPage({ searchParams }: GetStartedPageProps) {
  const { plan = "complete" } = await searchParams;

  // Check auth state to show appropriate CTA
  const user = await getCurrentUser();
  const hasAccess = user ? await hasActiveCourseAccess(user.id, user.hasPaid) : false;

  // Already enrolled → send straight to the course
  if (hasAccess) redirect("/seerah");

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-32 pb-24">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-4">
              Welcome
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Start Your Journey Through
              <br />
              <span className="text-gradient-gold">The Seerah</span>
            </h1>
            <p className="text-text-secondary max-w-xl mx-auto">
              Learn the complete life of the Prophet ﷺ at your own pace with structured video lessons, study materials, and progress tracking.
            </p>
          </div>

          {/* Main card */}
          <div className="group relative flex flex-col p-10 rounded-2xl border border-gold/40 bg-surface gold-glow-sm">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-gold" aria-hidden />
            </div>

            <div className="flex-1 mb-8">
              <h2 className="text-3xl font-bold text-text mb-4">Complete Seerah System</h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                Learn the complete Seerah curriculum at your own pace with videos,
                summaries, quizzes, mind maps, and comprehensive study materials.
              </p>

              {/* Features */}
              <ul className="space-y-3">
                {[
                  "Self-paced learning — go at your own speed",
                  "100+ chronologically organized parts",
                  "Video lessons, audio, and detailed briefings",
                  "Interactive quizzes and exams",
                  "Progress tracking across all sessions",
                  "Mind maps, infographics, and slide decks",
                  "Access from any device, anytime",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA — varies by auth state */}
            <div className="space-y-3">
              {user ? (
                // Logged in but no access yet → go to checkout
                <>
                  <Link
                    href={`/checkout?plan=${plan}`}
                    className={buttonClass("primary", "lg", "w-full justify-center")}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Unlock Full Access
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className={buttonClass("ghost", "md", "w-full justify-center text-text-secondary")}
                  >
                    View pricing options
                  </Link>
                </>
              ) : (
                // Guest → normal signup flow
                <>
                  <Link
                    href={`/signup-checkout?plan=${plan}`}
                    className={buttonClass("primary", "lg", "w-full justify-center")}
                  >
                    Create Account &amp; Start Learning
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className={buttonClass("ghost", "md", "w-full justify-center text-text-secondary")}
                  >
                    Already have an account? Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bottom note */}
          <div className="mt-10 text-center">
            <p className="text-sm text-text-muted">
              Questions?{" "}
              <Link href="/pricing" className="text-gold hover:text-gold-light transition-colors">
                View pricing
              </Link>
              {" "}or{" "}
              <Link href="/" className="text-gold hover:text-gold-light transition-colors">
                Learn more
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
