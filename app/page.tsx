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
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { WatchPreviewButton } from "@/components/landing/watch-preview-button";
import { HomepageTracker } from "@/components/landing/homepage-tracker";
import { getCurrentUser } from "@/lib/auth";
import { FREE_PART_NUMBER, hasActiveCourseAccess } from "@/lib/access";
import { getPreviewLangFromCookies } from "@/lib/part1-preview-data";
import { getErasForLang, getPartsForLang } from "@/lib/content";
import { siteT } from "@/lib/site-copy";
import { PLANS, formatPrice } from "@/lib/stripe-config";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getPreviewLangFromCookies();
  const title = `${siteT(lang, "courseName")} | ${siteT(lang, "heroLead")} ${siteT(lang, "heroGold")}`;
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

  const parts = getPartsForLang(lang);
  const eras = getErasForLang(lang);

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

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center">
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
                <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-6">
                  {siteT(lang, "heroLangs")}
                </p>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="flex justify-center">
                  <WatchPreviewButton
                    track="hero_watch_free_click"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {siteT(lang, "watchFree")}
                  </WatchPreviewButton>
                </div>

                <p className="text-xs sm:text-sm text-text-muted text-center mt-3">
                  {siteT(lang, "heroPreviewCaption")}
                </p>
              </FadeUp>
            </div>
        </div>
      </section>

      {/* ============================================================
          1b. THE GAP — why this course exists, before showing more
      ============================================================ */}
      <section className="py-10 border-t border-border">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            {siteT(lang, "problemBefore")}{" "}
            <span className="font-semibold text-text">{siteT(lang, "problemEmph")}</span>
            {" "}
            {siteT(lang, "problemAfter")}
          </p>
          <p className="mt-3 text-base sm:text-lg font-semibold text-gold">
            {siteT(lang, "problemClose")}
          </p>
        </div>
      </section>

      {/* ============================================================
          2. PART 15 MATERIALS — video + reading, slides, quiz, etc.
      ============================================================ */}
      <section id="preview" className="pt-8 pb-10 sm:pb-12 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {siteT(lang, "materialsTitle")}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              {siteT(lang, "materialsBody")}
            </p>
          </FadeUp>

          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-6 bg-surface-raised rounded w-1/3" />
                <div className="h-4 bg-surface-raised rounded w-1/2" />
                <div className="mt-6 h-40 bg-surface-raised rounded-xl" />
              </div>
            </div>
          }>
            <Part1FullPreview hideCta materialsOnly />
          </Suspense>

          {/* Compact link down to the merged Part 16 / pricing section below —
              no repeated pricing card here. Names the free lesson as proof
              of what every other part contains. */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            {siteT(lang, "sameForAllParts")}{" "}
            <a href="#pricing" className="font-semibold text-gold hover:text-gold-light underline underline-offset-2">
              {siteT(lang, "unlockAllParts")} →
            </a>
          </p>
        </div>
      </section>

      {/* ============================================================
          3. CURRICULUM — existing lesson titles
      ============================================================ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{siteT(lang, "curriculumTitle")}</h2>
            <p className="text-sm text-text-secondary">{siteT(lang, "curriculumBody")}</p>
          </div>
          <div className="space-y-2">
            {eras.map((era) => {
              const eraParts = parts.filter((part) => part.era === era.id);
              return (
                <details key={era.id} className="group rounded-xl border border-border bg-surface overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-text hover:bg-surface-raised">
                    <span>{era.label}</span>
                    <span className="text-xs font-medium text-text-muted">{eraParts.length}</span>
                  </summary>
                  <ol className="border-t border-border/50 px-5 py-3 space-y-1.5">
                    {eraParts.map((part) => (
                      <li key={part.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-text-secondary">
                          <span className="text-text-muted tabular-nums">{part.partNumber}.</span>{" "}
                          {part.partNumber === FREE_PART_NUMBER ? (
                            <WatchPreviewButton className="text-text hover:text-gold">{part.title}</WatchPreviewButton>
                          ) : (
                            part.title
                          )}
                        </span>
                        {part.partNumber === FREE_PART_NUMBER && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gold">
                            {siteT(lang, "previewFree")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. TRUST — sources & methodology
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
          5. WHAT HAPPENS AFTER YOU BUY — one concise explanation
      ============================================================ */}
      <section className="py-10 border-t border-border bg-surface/30">
        <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            {siteT(lang, "afterTitle")}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {siteT(lang, "afterOneLiner")}
          </p>
        </div>
      </section>

      {/* ============================================================
          6. FAQ
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
                    <>
                      {siteT(lang, "yesShort")} — <span dir="ltr">{formatPrice(PLANS.monthly.price)}</span>
                      {siteT(lang, "perMonthShort")}, {siteT(lang, "cancelAnytimeShort")}.
                    </>
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
          8. FINAL CTA — purchase action is primary, free preview is secondary
      ============================================================ */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">
            {siteT(lang, "finalTitle")}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-2 max-w-lg mx-auto">
            {siteT(lang, "finalBody")}
          </p>

          <div className="mt-6">
            <PricingSection
              hasLifetime={!!(user?.hasPaid)}
              hasMonthly={false}
              hasFamily={user?.planType === "family"}
              variant="plans-only"
              bare
              hideHeading
            />
          </div>

          <div className="mt-5 flex justify-center">
            <WatchPreviewButton
              track="final_watch_part1_clicked"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-text-secondary hover:text-gold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {siteT(lang, "watchFree")}
            </WatchPreviewButton>
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
