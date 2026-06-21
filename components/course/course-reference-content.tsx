"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
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

const REFERENCE_CARDS: ReferenceCard[] = [
  {
    slug: "family-household",
    title: "Family & Household",
    description:
      "A clear guide to the wives, children, and household of the Prophet ﷺ, with simple tables and historical notes.",
    available: true,
  },
  {
    slug: "timeline",
    title: "Timeline of the Seerah",
    description: "A chronological timeline of major events in the life of the Prophet ﷺ.",
    available: false, // TODO: Extract timeline content component
  },
  {
    slug: "key-people",
    title: "Key People in the Seerah",
    description: "Companions, leaders, and figures whose roles shaped the early Muslim community.",
    available: true,
  },
  {
    slug: "tribes-lineage",
    title: "Tribes and Lineage",
    description: "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back.",
    available: true,
  },
  {
    slug: "places-maps",
    title: "Places and Maps",
    description: "A reference to the key cities, routes, and locations mentioned in the Seerah.",
    available: true,
  },
  {
    slug: "battles",
    title: "Battles and Expeditions",
    description: "A clear reference to the major battles, campaigns, and expeditions of the Prophet ﷺ.",
    available: true,
  },
  {
    slug: "miracles",
    title: "Miracles and Signs",
    description: "Verified narrations of miracles and signs granted to the Prophet ﷺ.",
    available: true,
  },
  {
    slug: "important-terms",
    title: "Important Terms",
    description: "A glossary of Arabic and historical terms used throughout the Seerah.",
    available: true,
  },
];

function ReferenceIndex({ onSelectSection }: { onSelectSection: (slug: string) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
          Reference Library
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
          Seerah Reference Library
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
          Extra Seerah reference guides, timelines, people, places, and historical notes
          to help you understand the life of the Prophet ﷺ more clearly.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {REFERENCE_CARDS.filter((card) => card.available).map((card) => (
          <button
            key={card.slug}
            onClick={() => onSelectSection(card.slug)}
            className="relative p-5 rounded-2xl border bg-surface border-border hover:border-gold/30 transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg border bg-gold/10 border-gold/20 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-text group-hover:text-gold transition-colors">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-text-muted leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold group-hover:text-gold-light transition-colors">
              View {card.title}
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-text-secondary">
          More reference sections coming soon. Use these resources alongside your lessons
          to deepen your understanding of the Seerah.
        </p>
      </div>
    </div>
  );
}

export function CourseReferenceContent() {
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
    let DetailComponent: React.ComponentType | null = null;

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
      return (
        <div>
          {/* Back button */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
            <button
              onClick={handleBackToIndex}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Reference Library
            </button>
          </div>

          {/* Detail content */}
          <DetailComponent />
        </div>
      );
    }
  }

  // Otherwise show the index
  return <ReferenceIndex onSelectSection={handleSelectSection} />;
}
