"use client";

import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: 5;
  highlight?: string;
  featured?: boolean;
}

const testimonials: Testimonial[] = [
  {
    name: "Ahmed K.",
    role: "Software Engineer, USA",
    content: "Finally completed the entire Seerah for the first time in my life. The structure made it so easy to follow — I could pick up exactly where I left off. The videos, mindmaps, and briefings work perfectly together.",
    highlight: "Finally completed the entire Seerah for the first time",
    rating: 5,
    featured: true,
  },
  {
    name: "Yousef M.",
    role: "Student, UK",
    content: "I've tried multiple Seerah series before and always got lost. This system is different. Everything is organized, nothing is scattered. Part 1 to Part 100, straight through.",
    highlight: "Best investment in my Islamic education",
    rating: 5,
    featured: true,
  },
  {
    name: "Ibrahim A.",
    role: "Father of 3, Canada",
    content: "The infographics and mindmaps are incredible. I can finally visualize the timeline and connections between events. My kids are using this too — the multiple formats make it accessible for everyone.",
    highlight: "My kids are using this too",
    rating: 5,
  },
  {
    name: "Khalid R.",
    role: "Seerah Teacher, UAE",
    content: "As someone who teaches Seerah, this is the most comprehensive resource I've found. The study guides and source materials are scholarly and well-researched. I use the slides for my weekend classes.",
    highlight: "Most comprehensive resource I've found",
    rating: 5,
    featured: true,
  },
  {
    name: "Omar F.",
    role: "Doctor, Australia",
    content: "I listen to the audio during my commute and review the briefings at home. The system makes it so easy to learn at my own pace. I'm on Part 47 and haven't missed a single day in 3 months.",
    highlight: "Haven't missed a single day in 3 months",
    rating: 5,
  },
  {
    name: "Hamza S.",
    role: "Engineer, Malaysia",
    content: "This is what Islamic education should look like. Professional, organized, and respectful. No fluff, just high-quality content. The progress tracking keeps me motivated.",
    highlight: "Already recommended to 10+ friends",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const featuredTestimonials = testimonials.filter((t) => t.featured);
  const regularTestimonials = testimonials.filter((t) => !t.featured);

  return (
    <section className="py-20 border-t border-border bg-surface/30 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/2 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
            Student Experiences
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What happens when you learn Seerah <br className="hidden sm:block" />
            <span className="text-gradient-gold">with structure and clarity</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Real experiences from students who went from scattered knowledge to complete understanding
          </p>
        </div>

        {/* Featured Testimonials - Large Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {featuredTestimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group relative p-8 rounded-2xl border-2 border-gold/20 bg-gradient-to-b from-gold/5 to-surface hover:border-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-gold/10"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-gold" fill="currentColor" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-gold fill-gold"
                  />
                ))}
              </div>

              {/* Highlight Quote */}
              {testimonial.highlight && (
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gold leading-snug">
                    "{testimonial.highlight}"
                  </p>
                </div>
              )}

              {/* Content */}
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {testimonial.content}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-text-muted text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Regular Testimonials - Compact Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {regularTestimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group p-6 rounded-xl border border-border bg-surface hover:border-gold/20 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-gold fill-gold"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {testimonial.content}
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold text-xs">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text text-sm truncate">
                    {testimonial.name}
                  </p>
                  <p className="text-text-muted text-xs truncate">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-gold/20">
            <div className="flex -space-x-2">
              {['A', 'Y', 'I', 'K', 'O'].map((initial, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gold/20 border-2 border-surface flex items-center justify-center"
                >
                  <span className="text-gold font-bold text-xs">{initial}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-text-secondary">
              Join hundreds of students mastering the Seerah
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
