import Link from "next/link";
import { Play, ChevronDown, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FadeUp } from "@/components/motion";
import { FunnelTracker } from "@/components/analytics/funnel-tracker";
import { PortalButton } from "@/components/billing/portal-button";
import { LanguagesLaunchGate } from "@/components/student/languages-launch-gate";
import { LifetimePrice } from "@/components/pricing/country-price";

export const metadata = {
  title: "Complete Seerah Lifetime",
  description:
    "Finish the Prophet’s ﷺ life in order — and retain it. 100 parts, quizzes, flashcards. One-time lifetime access. Part 1 free. 7-day refund.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }>;
}

const FAQ_ITEMS = [
  {
    q: "What do I get with Complete Seerah Lifetime?",
    a: "The full 100-part course in order: video lessons, readings, quizzes, flashcards, summaries, mind maps, and progress tracking — plus future course updates included. English, Arabic, and French are available now.",
  },
  {
    q: "Will I actually finish — or just collect another course?",
    a: "The path is built to finish: one part at a time, in order, with quizzes and flashcards so you retain what you watch. Start free with Part 1, then unlock the full path.",
  },
  {
    q: "Is this a subscription?",
    a: "PRICE_ANSWER",
  },
  {
    q: "What if it’s not for me?",
    a: "7-day refund. If it’s not what you expected, contact us within 7 days for a full refund — the risk stays on us.",
  },
  {
    q: "Can I try before I buy?",
    a: "Yes. Part 1 is free with no account required. Preview it, then unlock the remaining 99 parts with lifetime access.",
  },
  {
    q: "Do I get access right away?",
    a: "Yes. Instant access after checkout on web and in the app.",
  },
];

function buildCheckoutBaseUrl(params: {
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}): string {
  const extra: string[] = [];
  if (params.source)       extra.push(`source=${encodeURIComponent(params.source)}`);
  if (params.utm_source)   extra.push(`utm_source=${encodeURIComponent(params.utm_source)}`);
  if (params.utm_medium)   extra.push(`utm_medium=${encodeURIComponent(params.utm_medium)}`);
  if (params.utm_campaign) extra.push(`utm_campaign=${encodeURIComponent(params.utm_campaign)}`);
  if (params.utm_content)  extra.push(`utm_content=${encodeURIComponent(params.utm_content)}`);
  return extra.length > 0 ? `/checkout?${extra.join("&")}` : "/checkout";
}

function buildWatchFreeUrl(params: {
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}): string {
  const extra: string[] = [];
  if (params.source)       extra.push(`source=${encodeURIComponent(params.source)}`);
  if (params.utm_source)   extra.push(`utm_source=${encodeURIComponent(params.utm_source)}`);
  if (params.utm_medium)   extra.push(`utm_medium=${encodeURIComponent(params.utm_medium)}`);
  if (params.utm_campaign) extra.push(`utm_campaign=${encodeURIComponent(params.utm_campaign)}`);
  if (params.utm_content)  extra.push(`utm_content=${encodeURIComponent(params.utm_content)}`);
  return extra.length > 0 ? `/watch-free?${extra.join("&")}` : "/watch-free";
}

export default async function PricingPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  let accessInfo: Awaited<ReturnType<typeof getUserAccessInfo>> | null = null;
  if (user) {
    accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
  }

  const hasLifetime = accessInfo?.hasLifetime ?? false;
  const hasMonthly  = !hasLifetime && (accessInfo?.hasActiveSubscription ?? false);
  const hasFamily   = user?.planType === "family";
  const checkoutBaseUrl = buildCheckoutBaseUrl(params);
  const watchFreeUrl = buildWatchFreeUrl(params);
  const needsBillingRecovery =
    !hasLifetime &&
    (accessInfo?.subscription?.status === "past_due" ||
      accessInfo?.subscription?.status === "unpaid");

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />
      <FunnelTracker
        creator="homepage"
        pricingSectionId="pricing"
        pageProps={{
          page: "pricing",
          utm_source: params.utm_source ?? null,
          utm_medium: params.utm_medium ?? null,
          utm_campaign: params.utm_campaign ?? null,
        }}
      />

      {/* Past-due recovery: checkout is blocked while Stripe still has an open
          past_due subscription, so buying a new plan here won't work. Point them
          at /billing (and the Stripe portal) instead of leaving them stuck. */}
      {needsBillingRecovery && (
        <div className="border-b border-red-500/30 bg-red-500/5">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-400 text-sm">
                Your subscription payment failed
              </p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                {accessInfo?.hasAccess
                  ? "Update your card to keep access. Buying a new plan won\u2019t work while this payment is still open."
                  : "Course access is paused until payment succeeds. Update your card — don\u2019t buy a new plan while this payment is still open."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <PortalButton label="Update payment method" variant="alert" />
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors"
                >
                  Go to billing
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Offer hero */}
      <section className="pt-14 pb-8 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold mb-3">
              Complete Seerah Lifetime
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 leading-tight">
              Finish the Prophet&apos;s ﷺ life in order — and retain it
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              One clear path through 100 parts. Videos to learn. Quizzes and flashcards so it sticks.
              Lifetime access for a one-time <LifetimePrice />.
            </p>
            <p className="text-xs text-text-muted">
              Part 1 free · Instant access · 7-day refund — risk on us
            </p>
          </FadeUp>
        </div>
      </section>

      {/* 2. Offer card */}
      <PricingSection
        hasLifetime={hasLifetime}
        hasMonthly={hasMonthly}
        hasFamily={hasFamily}
        checkoutBaseUrl={checkoutBaseUrl}
        variant="lifetime-only"
      />

      {/* 3. Named offer stack */}
      <section className="py-12 border-t border-border bg-surface/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-2">
              What&apos;s in the offer
            </h2>
            <p className="text-sm text-text-secondary text-center mb-8 leading-relaxed">
              Everything you need to start, finish, and remember — not another pile of content.
            </p>
            <ul className="space-y-3">
              {[
                {
                  title: "The Complete Path",
                  body: "100 structured parts covering every major event in order — no hopping around YouTube.",
                },
                {
                  title: "The Retention System",
                  body: "Quizzes and flashcards after lessons so you keep what you learned.",
                },
                {
                  title: "Progress You Can See",
                  body: "Dashboard + mind maps so you always know where you are in the Seerah.",
                },
                {
                  title: "Languages Included",
                  body: "English, Arabic, and French now — future course updates included with lifetime access.",
                },
                {
                  title: "Risk Reversal",
                  body: "7-day full refund. Try Part 1 free first if you want proof before you pay.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-gold/20 bg-surface px-4 py-3.5"
                >
                  <p className="font-semibold text-text text-sm mb-0.5">{item.title}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
            <p className="text-center text-sm text-text-muted mt-6">
              <LifetimePrice suffix=" one-time" /> · No subscription · Yours forever
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Optional preview link */}
      <section className="py-8 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-text-secondary mb-3">Not sure yet? Prove it to yourself first.</p>
          <Link
            href={watchFreeUrl}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Part 1 Free
          </Link>
        </div>
      </section>

      {/* 4. Pricing FAQ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-8">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {a === "PRICE_ANSWER" ? (
                    <>No. Complete Seerah Lifetime is <LifetimePrice /> one-time. No renewal. No recurring charges.</>
                  ) : (
                    a
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      {user && <LanguagesLaunchGate userId={user.id} />}
    </div>
  );
}
