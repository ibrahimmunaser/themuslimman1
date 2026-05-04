"use client";

import { Quote } from "lucide-react";

interface PerspectiveCard {
  perspective: string;
  title: string;
  content: string;
  featured?: boolean;
}

const perspectives: PerspectiveCard[] = [
  {
    perspective: "Parent Perspective",
    title: "Keep your children accountable",
    content: "Weekly progress reports show you exactly what your child is learning. See lessons watched, briefings read, quiz scores, and study time. No guessing — just clear progress tracking.",
    featured: true,
  },
  {
    perspective: "Student Perspective",
    title: "Finally complete the full Seerah",
    content: "No more scattered videos or incomplete series. Follow the Prophet's life ﷺ from beginning to end with a clear structure. Pick up exactly where you left off, every time.",
    featured: true,
  },
  {
    perspective: "Adult Learner Perspective",
    title: "Learn on your own schedule",
    content: "Watch during commute, listen while cooking, review briefings before bed. The multi-format approach lets you learn in whatever way fits your life.",
    featured: true,
  },
  {
    perspective: "Teacher Perspective",
    title: "Comprehensive teaching resources",
    content: "Slides, infographics, study guides, and source materials make it easy to prepare lessons. Everything is organized and ready to use for weekend classes or halaqahs.",
  },
  {
    perspective: "Busy Professional Perspective",
    title: "Progress tracking keeps you motivated",
    content: "See your completion rate, track your streak, and know exactly how far you've come. The system makes it easy to stay consistent even with a packed schedule.",
  },
  {
    perspective: "Family Perspective",
    title: "Multiple formats for every learning style",
    content: "Videos for visual learners, audio for listeners, text for readers, and mindmaps for big-picture thinkers. Every family member can engage with the content in their own way.",
  },
];

export function TestimonialsSection() {
  const featuredPerspectives = perspectives.filter((p) => p.featured);
  const regularPerspectives = perspectives.filter((p) => !p.featured);

  return (
    <section className="py-20 border-t border-border bg-surface/30 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/2 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
            What Students and Families Appreciate
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What happens when you learn Seerah <br className="hidden sm:block" />
            <span className="text-gradient-gold">with structure and clarity</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Different ways students, parents, and teachers benefit from this comprehensive system
          </p>
        </div>

        {/* Featured Perspectives - Large Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {featuredPerspectives.map((card) => (
            <div
              key={card.perspective}
              className="group relative p-8 rounded-2xl border-2 border-gold/20 bg-gradient-to-b from-gold/5 to-surface hover:border-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-gold/10"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-gold" fill="currentColor" />
              </div>

              {/* Perspective Label */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium">
                  {card.perspective}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-text mb-3 leading-snug">
                {card.title}
              </h3>

              {/* Content */}
              <p className="text-text-secondary text-sm leading-relaxed">
                {card.content}
              </p>
            </div>
          ))}
        </div>

        {/* Regular Perspectives - Compact Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {regularPerspectives.map((card) => (
            <div
              key={card.perspective}
              className="group p-6 rounded-xl border border-border bg-surface hover:border-gold/20 transition-all duration-300"
            >
              {/* Perspective Label */}
              <div className="mb-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium">
                  {card.perspective}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-text text-sm mb-2 leading-snug">
                {card.title}
              </h4>

              {/* Content */}
              <p className="text-text-secondary text-xs leading-relaxed">
                {card.content}
              </p>
            </div>
          ))}
        </div>

        {/* Social Proof Footer */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary text-sm">
            Join hundreds of students completing the Seerah with structure and clarity
          </p>
        </div>
      </div>
    </section>
  );
}
