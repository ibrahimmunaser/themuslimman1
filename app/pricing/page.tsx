import Link from "next/link";
import { Play, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";
import { PricingSection } from "@/components/pricing/pricing-section";
import { FadeUp } from "@/components/motion";

export const metadata = {
  title: "Pricing — Complete Seerah",
  description:
    "Choose your Seerah plan. Individual and family options, monthly or lifetime. Part 1 is free.",
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
    q: "What is included?",
    a: "Every plan includes the full 100-part Seerah course with video lessons, readings, quizzes, flashcards, summaries, mind maps, and progress tracking. All future content is included automatically.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly plans can be canceled anytime from your billing page. You keep access until the end of the current billing period.",
  },
  {
    q: "Is there a refund guarantee?",
    a: "Yes. If the course is not what you expected, contact us within 7 days for a full refund.",
  },
  {
    q: "Is Part 1 free?",
    a: "Yes. Part 1 is completely free with no account required. You can preview it on the Watch Part 1 Free page before choosing a plan.",
  },
  {
    q: "What is the difference between individual and family?",
    a: "Individual is for one learner. Family supports up to 5 separate learner profiles in one household, each with independent progress tracking.",
  },
  {
    q: "Do I get instant access?",
    a: "Yes. After checkout, you get immediate access to the full course on any device.",
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

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />
      <CreatorPromoTracker />

      {/* 1. Pricing hero */}
      <section className="pt-14 pb-8 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 leading-tight">
              Choose your Seerah plan
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              Get the full 100-part Seerah course with videos, readings, quizzes, flashcards,
              summaries, mind maps, and progress tracking.
            </p>
            <p className="text-xs text-text-muted">
              Part 1 is free · Cancel anytime · 7-day refund guarantee
            </p>
          </FadeUp>
        </div>
      </section>

      {/* 2. Plan cards */}
      <PricingSection
        hasLifetime={hasLifetime}
        hasMonthly={hasMonthly}
        hasFamily={hasFamily}
        checkoutBaseUrl={checkoutBaseUrl}
        variant="plans-only"
      />

      {/* 3. Individual vs family comparison */}
      <section className="py-12 border-t border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-8">
              Individual vs family
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-bold text-text mb-3">Individual</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>One learner on your account</li>
                  <li>Full course access and progress tracking</li>
                  <li>Best if you are studying on your own</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gold/25 bg-surface p-5">
                <h3 className="font-bold text-text mb-3">Family</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>Up to 5 learner profiles in one household</li>
                  <li>Each profile has independent progress</li>
                  <li>Best for spouses, parents, and kids learning together</li>
                </ul>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface-raised p-5">
                <h3 className="font-bold text-text mb-2">Monthly</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Lower upfront cost. Individual $4.99/month, family $9.99/month.
                  Cancel anytime.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-5">
                <h3 className="font-bold text-text mb-2">Lifetime</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Pay once, keep access forever. Individual $49, family $99.
                  Best long-term value if you plan to study for years.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Optional preview link */}
      <section className="py-8 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-text-secondary mb-3">Want to preview first?</p>
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
            Pricing questions
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
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
