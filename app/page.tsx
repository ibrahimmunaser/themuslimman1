import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Play } from "lucide-react";
import {
  FadeUp,
  FloatingGlow,
  IslamicPatternBackground,
} from "@/components/motion";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { StoreBadges } from "@/components/landing/store-badges";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { HomepageTracker } from "@/components/landing/homepage-tracker";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { LifetimePrice } from "@/components/pricing/country-price";
import { getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import { siteT } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getPreviewLangFromCookies();
  const title = `${siteT(lang, "courseName")} | ${siteT(lang, "heroLead")}`;
  const description = siteT(lang, "heroBody");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com",
      siteName: "Complete Seerah",
    },
  };
}

export default async function LandingPage() {
  const lang = await getPreviewLangFromCookies();
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user) {
    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (hasAccess) redirect("/seerah");
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <HomepageTracker />
      <Navbar />

      {/* ============================================================
          1. HERO — what it is, price, CTAs
      ============================================================ */}
      <section className="relative pt-10 pb-8 sm:pt-16 sm:pb-14 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.025} />
        <FloatingGlow className="absolute -top-20 left-1/2 -translate-x-1/2" width={700} height={400} duration={10} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp delay={0}>
            <h1 className="text-[1.85rem] sm:text-5xl font-bold tracking-tight leading-[1.2] sm:leading-tight mb-4">
              {siteT(lang, "heroLead")}{" "}
              <span className="text-gradient-gold">{siteT(lang, "heroGold")}</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-2 leading-relaxed">
              {siteT(lang, "heroBody")}
            </p>
            <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-2">
              {siteT(lang, "heroLangs")}
            </p>
            <p className="text-base sm:text-lg font-semibold text-gold mb-6">
              <LifetimePrice suffix={` ${siteT(lang, "oneTime")}`} /> · {siteT(lang, "lifetimeAccess")}
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/checkout?plan=individual-lifetime"
                data-track="hero_cta_checkout_click"
                data-plan="individual-lifetime"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/25"
              >
                {siteT(lang, "getLifetime")}
              </a>
              <a
                href="#preview"
                data-track="hero_watch_free_click"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-border hover:border-gold/40 text-text font-semibold text-base transition-colors"
              >
                <Play className="w-4 h-4 text-gold fill-current" />
                {siteT(lang, "watchFree")}
              </a>
            </div>
            <p className="text-xs sm:text-sm text-text-muted text-center mt-3">
              {siteT(lang, "heroFine")}
            </p>
            <div className="flex justify-center mt-6">
              <StoreBadges lang={lang} />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ============================================================
          2. SHORT PROBLEM — trimmed, non-judgmental
      ============================================================ */}
      <section className="border-t border-border bg-surface/40 px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-4 text-base sm:text-lg leading-relaxed text-center">
          <p className="text-text-secondary">
            {siteT(lang, "problemBefore")}{" "}
            <span className="text-text font-semibold">{siteT(lang, "problemEmph")}</span>
            {" "}{siteT(lang, "problemAfter")}
          </p>
          <p className="text-text font-semibold">
            {siteT(lang, "problemClose")}
          </p>
        </div>
      </section>

      {/* ============================================================
          3. PART 1 FREE PREVIEW — proof early
      ============================================================ */}
      <section id="preview" className="pt-8 pb-10 sm:pb-12 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-8">
            <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
              {siteT(lang, "previewKicker")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {siteT(lang, "previewTitle")}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              {siteT(lang, "previewBody")}
            </p>
          </FadeUp>

          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-6 bg-surface-raised rounded w-1/3" />
                <div className="h-4 bg-surface-raised rounded w-1/2" />
                <div className="mt-6 aspect-video bg-surface-raised rounded-xl" />
              </div>
            </div>
          }>
            <Part1FullPreview hideCta />
          </Suspense>
        </div>
      </section>

      {/* ============================================================
          4. WHAT EVERY LESSON INCLUDES — real examples, not icons only
      ============================================================ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {siteT(lang, "includesTitle")}
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto">
              {siteT(lang, "includesBody")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {/* Slide example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{siteT(lang, "slides")}</p>
                <p className="text-[10px] text-text-muted">{siteT(lang, "sample")}</p>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center bg-gradient-to-b from-surface-raised/80 to-surface min-h-[180px]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{siteT(lang, "keyIdea")}</p>
                <p className="text-base sm:text-lg font-bold text-text leading-snug mb-3">
                  {siteT(lang, "slideTitle")}
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-text-secondary">
                  <li className="flex gap-2"><span className="text-gold">•</span> {siteT(lang, "slide1")}</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> {siteT(lang, "slide2")}</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> {siteT(lang, "slide3")}</li>
                </ul>
              </div>
            </div>

            {/* Flashcard example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{siteT(lang, "flashcards")}</p>
                <p className="text-[10px] text-text-muted">{siteT(lang, "flipReview")}</p>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3 min-h-[180px]">
                <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-center">
                  <p className="text-[10px] text-gold font-semibold uppercase tracking-wider mb-2">{siteT(lang, "front")}</p>
                  <p className="text-sm font-semibold text-text leading-snug">
                    {siteT(lang, "flashQ")}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-raised p-4 text-center">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">{siteT(lang, "back")}</p>
                  <p className="text-sm text-text-secondary leading-snug">
                    {siteT(lang, "flashA")}
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{siteT(lang, "quiz")}</p>
                <p className="text-[10px] text-text-muted">{siteT(lang, "checkLabel")}</p>
              </div>
              <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                <p className="text-sm font-semibold text-text leading-snug mb-3">
                  {siteT(lang, "quizQ")}
                </p>
                <div className="space-y-2">
                  {[
                    { label: "A", text: siteT(lang, "optA"), active: true },
                    { label: "B", text: siteT(lang, "optB"), active: false },
                    { label: "C", text: siteT(lang, "optC"), active: false },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={[
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs sm:text-sm",
                        opt.active
                          ? "border-gold/40 bg-gold/10 text-text"
                          : "border-border bg-surface-raised/50 text-text-secondary",
                      ].join(" ")}
                    >
                      <span className={`font-bold ${opt.active ? "text-gold" : "text-text-muted"}`}>
                        {opt.label}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted mt-5">
            {siteT(lang, "plusFormats")}
          </p>
        </div>
      </section>

      {/* ============================================================
          5. TRUST — sources & methodology
      ============================================================ */}
      <section className="py-10 border-t border-border bg-surface/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{siteT(lang, "trustTitle")}</h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            {siteT(lang, "trustBody")}
          </p>
          <Link
            href="/methodology"
            className="inline-flex text-sm font-semibold text-gold hover:text-gold-light transition-colors"
          >
            {siteT(lang, "readMethod")}
          </Link>
        </div>
      </section>

      {/* ============================================================
          6. PRICING — after proof
      ============================================================ */}
      <PricingSection
        hasLifetime={!!(user?.hasPaid)}
        hasMonthly={false}
        hasFamily={user?.planType === "family"}
        variant="lifetime-only"
        compact
      />

      {/* ============================================================
          7. WHAT HAPPENS AFTER YOU BUY — brief
      ============================================================ */}
      <section className="py-10 border-t border-border bg-surface/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            {siteT(lang, "afterTitle")}
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            {siteT(lang, "afterSub")}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            {[
              { step: "1", title: siteT(lang, "s1t"), sub: siteT(lang, "s1s") },
              { step: "2", title: siteT(lang, "s2t"), sub: siteT(lang, "s2s") },
              { step: "3", title: siteT(lang, "s3t"), sub: siteT(lang, "s3s") },
            ].map((item) => (
              <div
                key={item.step}
                className="flex-1 flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-surface"
              >
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-0.5">
                  <span className="text-gold font-bold text-sm">{item.step}</span>
                </div>
                <p className="text-sm font-bold text-text">{item.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          8. FAQ
      ============================================================ */}
      <section id="faq" className="py-12 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">{siteT(lang, "faqTitle")}</h2>

          <div className="space-y-2">
            {[
              {
                q: siteT(lang, "q1"),
                a: siteT(lang, "a1"),
                open: true,
              },
              {
                q: siteT(lang, "q2"),
                a: siteT(lang, "a2"),
                method: true,
              },
              {
                q: siteT(lang, "q3"),
                a: siteT(lang, "a3"),
              },
              {
                q: siteT(lang, "q4"),
                a: siteT(lang, "a4"),
              },
              {
                q: siteT(lang, "q5"),
                a: "SUBSCRIPTION_PRICE",
              },
              {
                q: siteT(lang, "q6"),
                a: siteT(lang, "a6"),
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={item.open}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {item.a === "SUBSCRIPTION_PRICE" ? (
                    <>{siteT(lang, "a5pre")} <LifetimePrice /> {siteT(lang, "a5post")}</>
                  ) : (
                    item.a
                  )}
                  {"method" in item && item.method && (
                    <>
                      {" "}
                      <Link href="/methodology" className="text-gold hover:underline">
                        {siteT(lang, "q2link")}
                      </Link>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          9. FINAL CTA
      ============================================================ */}
      <section className="py-16 sm:py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">
            {siteT(lang, "finalTitle")}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-2 max-w-lg mx-auto">
            {siteT(lang, "finalBody")}
          </p>
          <p className="text-gold font-semibold text-base mb-7"><LifetimePrice suffix={` ${siteT(lang, "oneTime")}`} /> · {siteT(lang, "lifetimeAccess")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout?plan=individual-lifetime"
              data-track="final_checkout_clicked"
              data-plan="individual-lifetime"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/20"
            >
              {siteT(lang, "getLifetime")}
            </Link>
            <a
              href="#preview"
              data-track="final_watch_part1_clicked"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-border hover:border-gold/40 text-text font-semibold text-base transition-colors"
            >
              <Play className="w-4 h-4 text-gold fill-current" />
              {siteT(lang, "watchFree")}
            </a>
          </div>

          <p className="text-xs text-text-muted/50 mt-4">
            {siteT(lang, "finalFine")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
