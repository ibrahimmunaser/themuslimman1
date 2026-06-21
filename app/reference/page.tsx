import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Reference Library — Complete Seerah",
  description:
    "Extra Seerah reference guides, timelines, people, places, and historical notes to help you understand the life of the Prophet ﷺ more clearly.",
};

interface ReferenceCard {
  slug: string;
  title: string;
  description: string;
  cta: string;
  available: boolean;
}

const REFERENCE_CARDS: ReferenceCard[] = [
  {
    slug: "family-household",
    title: "Family & Household",
    description:
      "A clear guide to the wives, children, and household of the Prophet ﷺ, with simple tables and historical notes.",
    cta: "View Family & Household",
    available: true,
  },
  {
    slug: "timeline",
    title: "Timeline of the Seerah",
    description: "A chronological timeline of major events in the life of the Prophet ﷺ.",
    cta: "View Timeline",
    available: true,
  },
  {
    slug: "key-people",
    title: "Key People in the Seerah",
    description: "Companions, leaders, and figures whose roles shaped the early Muslim community.",
    cta: "View Key People",
    available: true,
  },
  {
    slug: "tribes-lineage",
    title: "Tribes and Lineage",
    description: "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back.",
    cta: "View Tribes & Lineage",
    available: true,
  },
  {
    slug: "places-maps",
    title: "Places and Maps",
    description: "A reference to the key cities, routes, and locations mentioned in the Seerah.",
    cta: "View Places & Maps",
    available: true,
  },
  {
    slug: "battles",
    title: "Battles and Expeditions",
    description: "A clear reference to the major battles, campaigns, and expeditions of the Prophet ﷺ.",
    cta: "View Battles & Expeditions",
    available: true,
  },
  {
    slug: "miracles",
    title: "Miracles and Signs",
    description: "Verified narrations of miracles and signs granted to the Prophet ﷺ.",
    cta: "View Miracles & Signs",
    available: true,
  },
  {
    slug: "important-terms",
    title: "Important Terms",
    description: "A glossary of Arabic and historical terms used throughout the Seerah.",
    cta: "Coming soon",
    available: false,
  },
];

export default function ReferenceLibraryPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div className="mb-12">
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
            {REFERENCE_CARDS.map((card) => (
              <div
                key={card.slug}
                className={`relative p-5 rounded-2xl border flex flex-col gap-3 ${
                  card.available
                    ? "bg-surface border-border hover:border-gold/30 transition-colors"
                    : "bg-surface/50 border-border/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg border flex-shrink-0 ${
                      card.available
                        ? "bg-gold/10 border-gold/20"
                        : "bg-surface-raised border-border/50"
                    }`}
                  >
                    <BookOpen
                      className={`w-4 h-4 ${card.available ? "text-gold" : "text-text-muted"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      className={`text-base font-semibold ${
                        card.available ? "text-text" : "text-text-secondary"
                      }`}
                    >
                      {card.title}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                {card.available ? (
                  <Link
                    href={`/reference/${card.slug}`}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-gold-light transition-colors"
                  >
                    {card.cta}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="mt-1 inline-block text-xs font-medium text-text-muted/60 tracking-wide uppercase">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Back to course */}
          <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
            >
              ← Continue the Seerah Course
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
