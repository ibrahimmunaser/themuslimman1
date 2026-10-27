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
import { getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import { siteT } from "@/lib/site-copy";

export async function generateMetadata() {
  const lang = await getPreviewLangFromCookies();
  return {
    title: siteT(lang, "priceKicker"),
    description: siteT(lang, "priceH1"),
  };
}

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
  const [user, params, lang] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getPreviewLangFromCookies(),
  ]);
  const faqItems = [
    { q: siteT(lang, "pq1"), a: siteT(lang, "pa1") },
    { q: siteT(lang, "pq2"), a: siteT(lang, "pa2") },
    { q: siteT(lang, "q5"), a: "PRICE_ANSWER" },
    { q: siteT(lang, "pq4"), a: siteT(lang, "pa4") },
    { q: siteT(lang, "pq5"), a: siteT(lang, "pa5") },
    { q: siteT(lang, "pq6"), a: siteT(lang, "pa6") },
  ];

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
              {siteT(lang, "priceKicker")}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 leading-tight">
              {siteT(lang, "priceH1")}
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              {siteT(lang, "priceLead")} <LifetimePrice />.
            </p>
            <p className="text-xs text-text-muted">
              {siteT(lang, "priceFine")}
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
              {siteT(lang, "stackTitle")}
            </h2>
            <p className="text-sm text-text-secondary text-center mb-8 leading-relaxed">
              {siteT(lang, "stackSub")}
            </p>
            <ul className="space-y-3">
              {[
                { title: siteT(lang, "stack1t"), body: siteT(lang, "stack1b") },
                { title: siteT(lang, "stack2t"), body: siteT(lang, "stack2b") },
                { title: siteT(lang, "stack3t"), body: siteT(lang, "stack3b") },
                { title: siteT(lang, "stack4t"), body: siteT(lang, "stack4b") },
                { title: siteT(lang, "stack5t"), body: siteT(lang, "stack5b") },
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
              <LifetimePrice suffix={` ${siteT(lang, "oneTime")}`} /> · {siteT(lang, "stackForever")}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Optional preview link */}
      <section className="py-8 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-text-secondary mb-3">{siteT(lang, "notSure")}</p>
          <Link
            href={watchFreeUrl}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            {siteT(lang, "watchFree")}
          </Link>
        </div>
      </section>

      {/* 4. Pricing FAQ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text text-center mb-8">
            {siteT(lang, "commonQ")}
          </h2>
          <div className="space-y-3">
            {faqItems.map(({ q, a }) => (
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
                    <>{siteT(lang, "pa3pre")} <LifetimePrice /> {siteT(lang, "pa3post")}</>
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
