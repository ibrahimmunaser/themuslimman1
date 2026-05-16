import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Complete Seerah",
  description:
    "Why the Complete Seerah course was built, what it is, what it is not, and how it works.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div className="mb-12">
            <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">About This Course</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Why We Built This
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              A note on the purpose, approach, and honest limits of the Complete Seerah system.
            </p>
          </div>

          <div className="space-y-12">

            {/* Section 1: Why this course exists */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                1. Why This Course Exists
              </h2>
              <div className="prose-like space-y-4 text-text-secondary leading-relaxed">
                <p>
                  {/*
                    FOUNDER NOTE — edit this paragraph to add your personal story.
                    Example: "I started learning the Seerah in [year] when..."
                  */}
                  This course was built by a Muslim who wanted to understand the life of Prophet Muhammad ﷺ
                  properly — not in fragments, not through occasional reminders, but as a complete,
                  connected story from beginning to end.
                </p>
                <p>
                  After years of encountering scattered pieces — a story here, a battle there, a name
                  mentioned without context — it became clear that most of us know <em>about</em> the
                  Prophet ﷺ without actually knowing his story. We recognise the names. We cannot place
                  them in sequence.
                </p>
                <p>
                  The Complete Seerah course is the structured learning tool that was missing: one
                  hundred parts, in order, covering the full biography from pre-Islamic Arabia to the
                  final days of the Prophet ﷺ.
                </p>
              </div>
            </section>

            {/* Section 2: The problem */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                2. The Problem We&rsquo;re Solving
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Most Muslims grow up with Seerah knowledge that is:
                </p>
                <ul className="space-y-2 pl-5">
                  {[
                    "Fragmented — absorbed through khutbahs, books, and YouTube clips with no common thread",
                    "Out of sequence — famous stories known without knowing what came before or after",
                    "Surface-level — names memorised without understanding their significance",
                    "Disconnected — events learned without grasping how one led to the next",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-gold mt-0.5 flex-shrink-0">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  The result is a biography we love but cannot fully explain. This course is an attempt
                  to fix that — not through a single lecture or a short summary, but through a structured,
                  sequential journey that builds understanding part by part.
                </p>
              </div>
            </section>

            {/* Section 3: What this course is */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                3. What This Course Is
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  The Complete Seerah is a structured learning system. It is designed for a Muslim who
                  wants to understand the life of the Prophet ﷺ as a connected story — not just memorable
                  moments.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 my-4">
                  {[
                    ["100 sequential parts", "Covering the full biography in chronological order"],
                    ["Multiple formats", "Video, audio, briefings, slides, infographics, flashcards, and quizzes"],
                    ["Progress tracking", "Learn at your own pace with clear completion tracking"],
                    ["Built for retention", "Each part uses multiple formats to reinforce understanding"],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-4 rounded-xl border border-border bg-surface">
                      <p className="text-sm font-semibold text-text mb-1">{title}</p>
                      <p className="text-sm text-text-muted">{desc}</p>
                    </div>
                  ))}
                </div>
                <p>
                  The goal is clarity, structure, and retention — not entertainment. The course is
                  serious about learning without being unnecessarily difficult to follow.
                </p>
              </div>
            </section>

            {/* Section 4: What this course is NOT */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                4. What This Course Is Not
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>We want to be honest about what this course does not claim to be:</p>
                <ul className="space-y-3 pl-5">
                  {[
                    {
                      label: "Not a fatwa source",
                      detail:
                        "This course does not issue legal rulings (fatwas). It is a historical and biographical learning resource.",
                    },
                    {
                      label: "Not a replacement for qualified scholars",
                      detail:
                        "The course is a structured learning tool. It does not replace the study of classical Seerah texts under qualified scholars.",
                    },
                    {
                      label: "Not a source of weak or fabricated narrations",
                      detail:
                        "We work to avoid fabricated stories, exaggerated claims, and narrations without basis. Where there is genuine scholarly disagreement, we note it.",
                    },
                    {
                      label: "Not entertainment-first",
                      detail:
                        "The course is designed to teach. We do not sensationalise or dramatise events to make them more engaging at the cost of accuracy.",
                    },
                  ].map(({ label, detail }) => (
                    <li key={label} className="flex items-start gap-3">
                      <span className="text-gold mt-0.5 flex-shrink-0">—</span>
                      <span>
                        <strong className="text-text">{label}.</strong>{" "}
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section 5: Our approach */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                5. Our Approach
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  The course is built around a simple principle: understand the story before trying to
                  memorise the details.
                </p>
                <p>
                  Each part is designed to teach the <em>context</em> — what was happening, why it
                  mattered, and how it connects to what came before and after. The goal is not that you
                  can recite dates, but that you understand why events unfolded as they did.
                </p>
                <p>
                  We follow the major classical Seerah sources. Where narrations are disputed, we aim
                  to acknowledge that honestly rather than present one version as settled fact.
                </p>
                <p>
                  {/*
                    FOUNDER NOTE — you can add methodology details here.
                    Example: "The primary sources we draw on include..."
                  */}
                  For more detail on our sources and methodology, see the{" "}
                  <Link href="/methodology" className="text-gold hover:underline">
                    Methodology page
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Section 6: Contact / Feedback */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                6. Contact &amp; Feedback
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  If you find an error in the course, a weak narration we should have flagged, or a
                  factual claim you want us to review — please tell us. We take corrections seriously.
                </p>
                <p>
                  If you have a question, a technical issue, or want to give general feedback, we
                  welcome that too.
                </p>
                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


