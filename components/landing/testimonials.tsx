"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock, BarChart3 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function TestimonialsSection() {
  return (
    <section className="py-20 border-t border-border bg-surface/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/2 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
          Complete Seerah
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Built for Structured Seerah Learning
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-4">
          Complete Seerah helps you study the life of the Prophet ﷺ as one connected journey,
          not scattered clips. Each part is designed to help you watch, read, review, test
          yourself, and track your progress.
        </p>
        <p className="text-sm text-text-muted max-w-xl mx-auto mb-10">
          Part 1 is free. Monthly or lifetime access for all 100 parts.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto text-left">
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <p className="font-semibold text-text text-sm mb-1">100 Structured Parts</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              The complete Seerah from pre-Islamic Arabia to the Prophet's ﷺ final days.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <p className="font-semibold text-text text-sm mb-1">Video, Read, Review</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Each part includes a video lesson, written briefing, quizzes, flashcards, and mind maps.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-gold" />
            </div>
            <p className="font-semibold text-text text-sm mb-1">Progress Tracking</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Track your progress across all 100 parts. Resume where you left off, any device.
            </p>
          </div>
        </div>

        <Link
          href="#preview"
          className={buttonClass("primary", "lg", "shadow-lg shadow-gold/20")}
        >
          Start with the Free Part 1 Preview
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
