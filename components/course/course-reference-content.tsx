"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { t } from "@/lib/ui-strings";
import { FamilyHouseholdContent } from "@/components/reference/family-household-content";
import { KeyPeopleContent } from "@/components/reference/key-people-content";
import { TribesLineageContent } from "@/components/reference/tribes-lineage-content";
import { BattlesExpeditionsContent } from "@/components/reference/battles-expeditions-content";
import { MiraclesSignsContent } from "@/components/reference/miracles-signs-content";
import { ImportantTermsContent } from "@/components/reference/important-terms-content";
import { PlacesMapsContent } from "@/components/reference/places-maps-content";

interface ReferenceCard {
  slug: string;
  title: string;
  description: string;
  available: boolean;
}

interface ReferenceCardDef {
  slug: string;
  titleKey: "refFamilyTitle" | "refTimelineTitle" | "refKeyPeopleTitle" | "refTribesTitle" | "refPlacesTitle" | "refBattlesTitle" | "refMiraclesTitle" | "refTermsTitle";
  descKey: "refFamilyDesc" | "refTimelineDesc" | "refKeyPeopleDesc" | "refTribesDesc" | "refPlacesDesc" | "refBattlesDesc" | "refMiraclesDesc" | "refTermsDesc";
  available: boolean;
}

const REFERENCE_CARD_DEFS: ReferenceCardDef[] = [
  { slug: "family-household", titleKey: "refFamilyTitle",    descKey: "refFamilyDesc",    available: true },
  { slug: "timeline",         titleKey: "refTimelineTitle",  descKey: "refTimelineDesc",  available: false },
  { slug: "key-people",       titleKey: "refKeyPeopleTitle", descKey: "refKeyPeopleDesc", available: true },
  { slug: "tribes-lineage",   titleKey: "refTribesTitle",    descKey: "refTribesDesc",    available: true },
  { slug: "places-maps",      titleKey: "refPlacesTitle",    descKey: "refPlacesDesc",    available: true },
  { slug: "battles",          titleKey: "refBattlesTitle",   descKey: "refBattlesDesc",   available: true },
  { slug: "miracles",         titleKey: "refMiraclesTitle",  descKey: "refMiraclesDesc",  available: true },
  { slug: "important-terms",  titleKey: "refTermsTitle",     descKey: "refTermsDesc",     available: true },
];

function ReferenceIndex({ onSelectSection, lang }: { onSelectSection: (slug: string) => void; lang: CourseLang }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
          {t(lang, "referenceLibrary")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
          {t(lang, "seerahReferenceLib")}
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
          {t(lang, "referenceLibDesc")}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {REFERENCE_CARD_DEFS.filter((card) => card.available).map((card) => {
          const cardTitle = t(lang, card.titleKey);
          return (
            <button
              key={card.slug}
              onClick={() => onSelectSection(card.slug)}
              className="relative p-5 rounded-2xl border bg-surface border-border hover:border-gold/30 transition-colors group text-start cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg border bg-gold/10 border-gold/20 flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-text group-hover:text-gold transition-colors">
                    {cardTitle}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">
                    {t(lang, card.descKey)}
                  </p>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold group-hover:text-gold-light transition-colors">
                {lang === "ar" ? `عرض ${cardTitle}` : `View ${cardTitle}`}
                {lang === "ar" ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-text-secondary">
          {t(lang, "moreSectionsSoon")}
        </p>
      </div>
    </div>
  );
}

export function CourseReferenceContent({ lang = "en" }: { lang?: CourseLang }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const section = searchParams.get("section");

  const handleSelectSection = (slug: string) => {
    router.replace(`/seerah?tab=reference&section=${slug}`, { scroll: false });
  };

  const handleBackToIndex = () => {
    router.replace(`/seerah?tab=reference`, { scroll: true });
  };

  // If a section is selected, render it inline
  if (section) {
    let DetailComponent: React.ComponentType<{ lang?: CourseLang }> | null = null;

    switch (section) {
      case "family-household":
        DetailComponent = FamilyHouseholdContent;
        break;
      case "key-people":
        DetailComponent = KeyPeopleContent;
        break;
      case "tribes-lineage":
        DetailComponent = TribesLineageContent;
        break;
      case "battles":
        DetailComponent = BattlesExpeditionsContent;
        break;
      case "miracles":
        DetailComponent = MiraclesSignsContent;
        break;
      case "important-terms":
        DetailComponent = ImportantTermsContent;
        break;
      case "places-maps":
        DetailComponent = PlacesMapsContent;
        break;
    }

    if (DetailComponent) {
      const isRtl = lang === "ar";
      return (
        <div>
          {/* Back button */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
            <button
              onClick={handleBackToIndex}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-6"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              {t(lang, "backToRefLib")}
            </button>
          </div>

          {/* Detail content — each of these reference guides accepts a `lang` prop
              and renders its own bilingual data/chrome with the correct dir. */}
          <DetailComponent lang={lang} />
        </div>
      );
    }
  }

  // Otherwise show the index
  return <ReferenceIndex onSelectSection={handleSelectSection} lang={lang} />;
}
