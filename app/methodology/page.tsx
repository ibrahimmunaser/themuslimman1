import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources & Methodology | Complete Seerah",
  description:
    "How Complete Seerah approaches the life of Prophet Muhammad ﷺ — sources used, what this course is, and what it is not.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-ink text-text">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Back link */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4">
          Sources &amp; Methodology
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed mb-12">
          How this course approaches the life of the Prophet ﷺ — and what it
          is and is not.
        </p>

        <div className="space-y-10 text-text-secondary leading-relaxed">
          {/* Purpose */}
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">
              Purpose of This Course
            </h2>
            <p>
              This Seerah course is designed to teach the life of Prophet
              Muhammad ﷺ in a structured and accessible way. The goal is to help
              Muslims understand the Seerah as one connected story — not as
              scattered events, isolated incidents, or emotional anecdotes
              without context.
            </p>
            <p className="mt-3">
              The course is built for Muslim learners who want to understand
              where we came from, what the Prophet ﷺ went through, and why the
              Seerah matters to us today.
            </p>
          </section>

          {/* Approach */}
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">
              Our Approach
            </h2>
            <p>
              The course is prepared with care toward classical Seerah material
              and mainstream Sunni presentation. It avoids
              entertainment-first storytelling, exaggerated details, and
              unsupported emotional embellishments. Where certain reports require
              caution, the course focuses on what can be responsibly taught to
              general Muslim learners.
            </p>
            <p className="mt-3">
              The emphasis is on accuracy, honesty about the scope of this
              material, and presenting the Seerah in a way that builds genuine
              understanding — not just emotional engagement without knowledge.
            </p>
          </section>

          {/* Source categories */}
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">
              Source Categories
            </h2>
            <p className="mb-4">
              This course draws from the following categories of material:
            </p>
            <ul className="space-y-3 pl-0 list-none">
              {[
                {
                  label: "The Qur'an",
                  desc: "Verses related to the Prophet's ﷺ life, mission, and the events of his time are referenced throughout.",
                },
                {
                  label: "Authentic Hadith",
                  desc: "Where relevant, narrations graded authentic by mainstream hadith scholarship are used to support and clarify events.",
                },
                {
                  label: "Classical Seerah Works",
                  desc: "The course is informed by classical Seerah literature — the foundational texts Muslim scholars have relied upon for centuries.",
                },
                {
                  label: "Scholarly Summaries & Educational Material",
                  desc: "Later scholarly summaries and educational Seerah works that synthesize and explain the classical material for modern learners.",
                },
              ].map(({ label, desc }) => (
                <li
                  key={label}
                  className="pl-4 border-l-2 border-gold/30"
                >
                  <span className="font-semibold text-text">{label}:</span>{" "}
                  {desc}
                </li>
              ))}
            </ul>
          </section>

          {/* What this course is not */}
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">
              What This Course Is Not
            </h2>
            <ul className="space-y-2 list-disc list-inside marker:text-gold/60">
              <li>
                This course is not a fatwa, a legal ruling, or a replacement for
                direct study with qualified scholars.
              </li>
              <li>
                It is not a formal academic thesis or a primary research work.
              </li>
              <li>
                It does not claim scholar review or formal approval unless that
                is stated explicitly for a specific lesson.
              </li>
              <li>
                It does not overstate the authenticity of narrations or present
                disputed reports as settled facts.
              </li>
            </ul>
          </section>

          {/* What this course is */}
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">
              What This Course Is
            </h2>
            <p>
              This is a structured learning tool designed to help students
              begin, organize, review, and retain the Seerah. It is a serious
              attempt to present the life of the Prophet ﷺ in a way that is
              honest, coherent, and beneficial — one that takes the source
              material seriously without overclaiming what the course is.
            </p>
            <p className="mt-3">
              If you find an error, have a concern about a specific narration, or
              want to raise something for review, please{" "}
              <Link
                href="/contact"
                className="text-gold hover:text-gold-light transition-colors underline underline-offset-2"
              >
                contact us directly
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-text-muted">
          <Link href="/" className="hover:text-text transition-colors">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-text transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-text transition-colors">
            Contact
          </Link>
          <Link href="/terms" className="hover:text-text transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-text transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </main>
  );
}

