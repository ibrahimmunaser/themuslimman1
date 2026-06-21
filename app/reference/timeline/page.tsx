import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline of the Seerah — Seerah Reference",
  description:
    "A chronological timeline of major events in the life of the Prophet Muhammad ﷺ from birth to passing.",
};

export default function TimelinePage() {
  redirect("/seerah?tab=reference&section=timeline");
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "570 CE",
    title: "Birth in Makkah",
    description: "The Prophet Muhammad ﷺ was born in Makkah into the noble clan of Banu Hashim.",
  },
  {
    date: "576 CE",
    title: "Orphaned at a Young Age",
    description: "After losing his father before birth, he later lost his mother at around six years old and was raised under the care of his family.",
  },
  {
    date: "595 CE",
    title: "Marriage to Khadijah رضي الله عنها",
    description: "He married Khadijah رضي الله عنها, who would later become the first person to believe in him.",
  },
  {
    date: "610 CE",
    title: "First Revelation",
    description: "The first revelation came to him through Jibril عليه السلام in the cave of Hira, beginning his Prophethood.",
  },
  {
    date: "613 CE",
    title: "Public Call Begins",
    description: "After a period of private da'wah, the Prophet ﷺ began calling people publicly to worship Allah alone.",
  },
  {
    date: "615 CE",
    title: "Migration to Abyssinia",
    description: "Some early Muslims migrated to Abyssinia to escape persecution and preserve their religion.",
  },
  {
    date: "619 CE",
    title: "The Year of Sorrow",
    description: "Khadijah رضي الله عنها and Abu Talib passed away, leaving the Prophet ﷺ without two of his strongest supporters.",
  },
  {
    date: "620–621 CE",
    title: "Isra and Mi'raj",
    description: "The Prophet ﷺ was honored with the Night Journey and Ascension, including the command of the five daily prayers.",
  },
  {
    date: "622 CE / 1 AH",
    title: "Hijrah to Madinah",
    description: "The Prophet ﷺ migrated from Makkah to Madinah. This event became the starting point of the Islamic calendar.",
  },
  {
    date: "624 CE / 2 AH",
    title: "Battle of Badr",
    description: "The Muslims won a major victory at Badr, a turning point for the early Muslim community.",
  },
  {
    date: "625 CE / 3 AH",
    title: "Battle of Uhud",
    description: "The Muslims faced a painful setback at Uhud, teaching lessons about obedience, patience, and discipline.",
  },
  {
    date: "627 CE / 5 AH",
    title: "Battle of the Trench",
    description: "The Muslims defended Madinah during a major siege and Allah protected the believers.",
  },
  {
    date: "628 CE / 6 AH",
    title: "Treaty of Hudaybiyyah",
    description: "The Prophet ﷺ accepted a treaty with Quraysh that seemed difficult at first, but became a major opening for Islam.",
  },
  {
    date: "630 CE / 8 AH",
    title: "Conquest of Makkah",
    description: "The Prophet ﷺ entered Makkah victorious and forgave many of those who had harmed him and the Muslims.",
  },
  {
    date: "630 CE / 8 AH",
    title: "Hunayn and Ta'if",
    description: "After Makkah, the Muslims faced new battles and the Arabian tribes continued entering Islam.",
  },
  {
    date: "631 CE / 9 AH",
    title: "Year of Delegations",
    description: "Tribes from across Arabia came to Madinah, accepting Islam and recognizing the leadership of the Prophet ﷺ.",
  },
  {
    date: "632 CE / 10 AH",
    title: "Farewell Hajj",
    description: "The Prophet ﷺ performed his final Hajj and gave his famous farewell sermon.",
  },
  {
    date: "632 CE / 11 AH",
    title: "Passing of the Prophet ﷺ",
    description: "The Prophet ﷺ passed away in Madinah after completing his mission and conveying the message.",
  },
];

export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-ink py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Back link */}
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Reference Library
          </Link>

          {/* Page header */}
          <div className="mb-12">
            <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
              Reference Library
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Timeline of the Seerah
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-2">
              A chronological timeline of major events in the life of the Prophet ﷺ.
            </p>
            <p className="text-sm text-text-muted italic">
              Dates before the Hijrah are approximate in the Gregorian calendar.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-gold/40" aria-hidden="true" />

            <div className="space-y-8">
              {TIMELINE_EVENTS.map((event, index) => (
                <div key={index} className="relative flex gap-4 sm:gap-6">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0 pt-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gold/30 bg-surface flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    </div>
                    {/* Connector glow */}
                    <div className="absolute inset-0 rounded-full bg-gold/10 blur-md -z-10" aria-hidden="true" />
                  </div>

                  {/* Event card */}
                  <div className="flex-1 pb-2">
                    <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors">
                      <p className="text-xs font-semibold text-gold mb-2 uppercase tracking-wider">
                        {event.date}
                      </p>
                      <h3 className="text-base sm:text-lg font-bold text-text mb-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <section className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-sm text-text-muted mb-1">Ready to go deeper?</p>
                <p className="text-base font-semibold text-text">
                  Learn the full life of the Prophet ﷺ in 100 sequential parts.
                </p>
              </div>
              <Link
                href="/seerah"
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
              >
                Continue Learning the Seerah
              </Link>
            </div>
          </section>

          {/* Back link */}
          <div className="mt-12 pb-4">
            <Link
              href="/reference"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Reference Library
            </Link>
          </div>

        </div>
      </main>
  );
}
