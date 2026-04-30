"use client";

import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: 5;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Ahmed K.",
    role: "Software Engineer, USA",
    content: "Finally completed the entire Seerah for the first time in my life. The structure made it so easy to follow — I could pick up exactly where I left off. The videos, mindmaps, and briefings work perfectly together.",
    rating: 5,
  },
  {
    name: "Yousef M.",
    role: "Student, UK",
    content: "I've tried multiple Seerah series before and always got lost. This system is different. Everything is organized, nothing is scattered. Part 1 to Part 100, straight through. Best investment in my Islamic education.",
    rating: 5,
  },
  {
    name: "Ibrahim A.",
    role: "Business Owner, Canada",
    content: "The infographics and mindmaps are incredible. I can finally visualize the timeline and connections between events. My kids are using this too — the multiple formats make it accessible for everyone.",
    rating: 5,
  },
  {
    name: "Khalid R.",
    role: "Teacher, UAE",
    content: "As someone who teaches Seerah, this is the most comprehensive resource I've found. The study guides and source materials are scholarly and well-researched. Worth every penny.",
    rating: 5,
  },
  {
    name: "Omar F.",
    role: "Doctor, Australia",
    content: "I listen to the audio during my commute and review the briefings at home. The system makes it so easy to learn at my own pace. I'm on Part 47 and haven't missed a single day in 3 months.",
    rating: 5,
  },
  {
    name: "Hamza S.",
    role: "Engineer, Malaysia",
    content: "This is what Islamic education should look like. Professional, organized, and respectful. No fluff, just high-quality content. The progress tracking keeps me motivated. Already recommended to 10+ friends.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 border-t border-border bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What This System Helps You Do
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Not scattered lectures. Not random clips. A full structured journey designed for real learning.
          </p>
        </div>

        {/* Product Truth (Not Fake Stats) */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-14">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gold mb-1">100+</div>
            <div className="text-sm text-text-muted">Structured Parts</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gold mb-1">8+</div>
            <div className="text-sm text-text-muted">Asset Types Per Part</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gold mb-1">1</div>
            <div className="text-sm text-text-muted">Complete System</div>
          </div>
        </div>

        {/* Outcome-Focused Benefits (Not Fake Reviews) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📅",
              title: "See the full timeline clearly",
              desc: "Follow the Prophet's ﷺ life from birth to his final days in perfect chronological order.",
            },
            {
              icon: "💡",
              title: "Understand why events happened",
              desc: "Get the context behind every major moment — not just what happened, but why it mattered.",
            },
            {
              icon: "🧠",
              title: "Remember key moments with visuals",
              desc: "Use mindmaps, infographics, and timelines to retain what you learn and see connections.",
            },
            {
              icon: "📖",
              title: "Connect Seerah to Qur'an and Hadith",
              desc: "See how the Prophet's ﷺ life connects to revelation and authentic traditions.",
            },
            {
              icon: "👨‍👩‍👧‍👦",
              title: "Study alone or with family",
              desc: "Perfect for personal learning, family sessions, or teaching in study circles.",
            },
            {
              icon: "🌱",
              title: "Build long-term familiarity with the Prophet's ﷺ life",
              desc: "Not a one-time watch — a system you can return to and deepen your understanding over time.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-xl border border-border bg-surface hover:border-gold/20 transition-all"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-text text-base mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
