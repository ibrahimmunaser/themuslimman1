import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { CheckCircle2, ArrowRight, Play, Lock, Star, Users } from "lucide-react";
import { PLANS } from "@/lib/stripe-config";

export const metadata = { title: "Get Access — Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const user = await getCurrentUser();

  // Not logged in — send to signup
  if (!user) redirect("/signup");

  // Email not verified — stay here but show a note
  const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);

  // Already has access — go to the course
  if (accessInfo.hasAccess) {
    if (user.planType === "family") redirect("/profiles");
    redirect("/seerah");
  }

  const firstName = (user.fullName ?? user.email.split("@")[0])
    .split(" ")[0];

  const isEmailVerified = user.emailVerified;

  return (
    <div className="min-h-screen bg-ink text-text flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-gold font-bold text-lg">TheMuslimMan</span>
        </Link>
        <span className="text-sm text-text-muted">
          Signed in as <span className="text-text">{user.email}</span>
        </span>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-10">

        {/* ── Personal greeting ───────────────────────────────── */}
        <div className="text-center space-y-3">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest">
            Welcome, {firstName}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text leading-tight">
            You&apos;re one step away from<br className="hidden sm:block" /> the complete Seerah
          </h1>
          <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
            Your account is ready. Choose a plan below to unlock all 100 parts — videos,
            quizzes, flashcards, mind maps, and more.
          </p>
        </div>

        {/* ── Email verification notice ───────────────────────── */}
        {!isEmailVerified && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">Check your email first</p>
              <p className="text-xs text-text-secondary mt-0.5">
                We sent a verification link to <strong>{user.email}</strong>. Verify it before you pay — you&apos;ll need it to sign back in.
              </p>
            </div>
          </div>
        )}

        {/* ── What's included ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            "100 video lessons",
            "100 quizzes",
            "100 mind maps",
            "300 visual slides",
            "100 flashcard sets",
            "Guided progress tracking",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* ── Plan cards ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Individual Lifetime */}
          <div className="relative rounded-2xl border-2 border-gold bg-gold/5 p-6 flex flex-col gap-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-ink text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
              Most Popular
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              <p className="font-bold text-text">{PLANS.complete.name}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold">${PLANS.complete.price / 100}</p>
              <p className="text-xs text-text-muted mt-0.5">one-time · lifetime access</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Pay once, own it forever. All future content included, no recurring charges.
            </p>
            <Link
              href="/checkout?plan=individual&billing=lifetime"
              className="mt-auto inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
            >
              Get Lifetime Access
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-center text-xs text-text-muted">
              Also: <strong className="text-text-secondary">${PLANS.monthly.price / 100}/month</strong>{" "}
              <Link href="/checkout?plan=individual&billing=monthly" className="text-gold hover:underline">
                Start monthly →
              </Link>
            </p>
          </div>

          {/* Family Lifetime */}
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-text-muted" />
              <p className="font-bold text-text">{PLANS.family.name}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-text">${PLANS.family.price / 100}</p>
              <p className="text-xs text-text-muted mt-0.5">one-time · up to 5 learner profiles</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              One account, five learners. Each family member gets their own separate progress.
            </p>
            <Link
              href="/checkout?plan=family&billing=lifetime"
              className="mt-auto inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-border hover:border-gold/40 hover:bg-surface-raised text-text font-semibold text-sm transition-colors"
            >
              Get Family Access
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-center text-xs text-text-muted">
              Also: <strong className="text-text-secondary">${PLANS.familyMonthly.price / 100}/month</strong>{" "}
              <Link href="/checkout?plan=family&billing=monthly" className="text-gold hover:underline">
                Start monthly →
              </Link>
            </p>
          </div>
        </div>

        {/* ── Free preview nudge ──────────────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">Not sure yet?</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Watch Part 1 completely free — no payment required.
            </p>
          </div>
          <Link
            href="/seerah/part-1"
            className="flex-shrink-0 text-sm font-semibold text-gold hover:text-gold-light transition-colors whitespace-nowrap"
          >
            Watch free →
          </Link>
        </div>

        {/* ── Trust row ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Secure payment via Stripe
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
            7-Day Clarity Guarantee
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
            Cancel monthly anytime
          </div>
        </div>

      </div>
    </div>
  );
}
