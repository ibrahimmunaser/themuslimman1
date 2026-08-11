"use client";

import { useState, useCallback, useRef } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { FlashcardSet, FlashcardLevel, Flashcard } from "@/lib/types";
import { trackFlashcardsReviewed } from "@/app/actions/progress";

interface FlashcardsViewerProps {
  flashcards: FlashcardSet;
  partNumber?: number;
  previewMode?: boolean;
  isRtl?: boolean;
}

const LEVELS: { id: FlashcardLevel; label: string; labelAr: string }[] = [
  { id: "easy",   label: "Easy",   labelAr: "سهل" },
  { id: "medium", label: "Medium", labelAr: "متوسط" },
  { id: "full",   label: "Full",   labelAr: "كامل" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function FlipCard({
  card,
  index,
  total,
  onEngage,
  isRtl,
}: {
  card: Flashcard;
  index: number;
  total: number;
  onEngage?: () => void;
  isRtl?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  const toggle = () => {
    onEngage?.();
    setFlipped((f) => !f);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-400">
          {isRtl ? `البطاقة ${index + 1} من ${total}` : `Card ${index + 1} of ${total}`}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end max-w-[60%]">
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i < index   ? "bg-amber-500/30 w-3" :
                i === index ? "bg-amber-500 w-6"     :
                              "bg-zinc-700 w-3"
              )}
            />
          ))}
          {total > 20 && (
            <span className="text-xs text-zinc-500 ms-2">+{total - 20}</span>
          )}
        </div>
      </div>

      {/* Live region announces flip state to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isRtl
          ? (flipped ? `الجواب: ${card.side2}` : `السؤال: ${card.side1}`)
          : (flipped ? `Answer: ${card.side2}` : `Question: ${card.side1}`)}
      </div>

      {/* Flip card — using opacity swap for universal mobile compatibility */}
      <div
        className="relative cursor-pointer select-none min-h-[260px] sm:min-h-[300px]"
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        role="button"
        tabIndex={0}
        aria-label={
          isRtl
            ? (flipped ? "البطاقة تعرض الجواب — اضغط Enter أو انقر للعودة إلى السؤال" : "البطاقة تعرض السؤال — اضغط Enter أو انقر لإظهار الجواب")
            : (flipped ? "Card showing answer — press Enter or tap to flip back to question" : "Card showing question — press Enter or tap to reveal answer")
        }
      >
        {/* Front — question */}
        <div
          className={clsx(
            "absolute inset-0 flex flex-col justify-center items-center rounded-2xl border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-10 shadow-xl transition-all duration-300",
            flipped ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
          )}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold tracking-wider uppercase text-amber-400">
              {isRtl ? "السؤال" : "Question"}
            </span>
          </div>
          <p className="text-base sm:text-xl font-semibold text-white leading-relaxed text-center max-w-2xl mt-4">
            {card.side1}
          </p>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-amber-400/80 text-sm font-medium whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>{isRtl ? "انقر لإظهار الجواب" : "Tap to reveal answer"}</span>
          </div>
        </div>

        {/* Back — answer */}
        <div
          className={clsx(
            "absolute inset-0 flex flex-col justify-center items-center rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 p-6 sm:p-10 shadow-xl transition-all duration-300",
            flipped ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-95"
          )}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase text-amber-300">
              {isRtl ? "الجواب" : "Answer"}
            </span>
          </div>
          <p className="text-base sm:text-xl font-semibold text-white leading-relaxed text-center max-w-2xl mt-4 mb-4">
            {card.side2}
          </p>
          {/* Tags are English-only topic labels — hide on Arabic to avoid mixed-language chips */}
          {!isRtl && card.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-zinc-500 text-xs whitespace-nowrap">
            {isRtl ? "انقر للعودة" : "Tap to flip back"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlashcardsViewer({ flashcards, partNumber, previewMode, isRtl }: FlashcardsViewerProps) {
  const [level, setLevel] = useState<FlashcardLevel>("easy");
  const [index, setIndex] = useState(0);
  const [deck, setDeck] = useState<Flashcard[]>(flashcards.easy);
  const [shuffled, setShuffled] = useState(false);
  const trackedRef = useRef(false);

  // Track after the user flips/navigates a card (engagement), not on mount —
  // mirrors mobile flashcards_tab first-flip tracking.
  const markReviewed = useCallback(() => {
    if (!partNumber || trackedRef.current || previewMode) return;
    trackedRef.current = true;
    trackFlashcardsReviewed(partNumber).catch(() => {});
    window.dispatchEvent(
      new CustomEvent("seerah:progressUpdate", { detail: { flashcardsReviewed: true } })
    );
  }, [partNumber, previewMode]);

  const switchLevel = useCallback((newLevel: FlashcardLevel) => {
    setLevel(newLevel);
    setIndex(0);
    setShuffled(false);
    setDeck(flashcards[newLevel]);
  }, [flashcards]);

  const handleShuffle = () => {
    markReviewed();
    setDeck(shuffleArray(deck));
    setIndex(0);
    setShuffled(true);
  };

  const handleReset = () => {
    setDeck(flashcards[level]);
    setIndex(0);
    setShuffled(false);
  };

  const prev = () => {
    markReviewed();
    setIndex((i) => Math.max(0, i - 1));
  };
  const next = () => {
    markReviewed();
    setIndex((i) => Math.min(deck.length - 1, i + 1));
  };

  const card = deck[index];

  if (!card) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-400 text-base">
          {isRtl ? "لا توجد بطاقات تعليمية لهذا المستوى." : "No flashcards available for this level."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Level selector + controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-zinc-800">
        <div className="flex gap-2">
          {LEVELS.map((l) => {
            const count = flashcards.counts[l.id];
            return (
              <button
                key={l.id}
                onClick={() => switchLevel(l.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all",
                  level === l.id
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                {isRtl ? l.labelAr : l.label}
                <span className={clsx(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  level === l.id ? "bg-amber-500/30 text-amber-300" : "bg-zinc-800 text-zinc-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {shuffled ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              {isRtl ? "إعادة الترتيب" : "Reset Order"}
            </button>
          ) : (
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              {isRtl ? "ترتيب عشوائي" : "Shuffle"}
            </button>
          )}
        </div>
      </div>

      {/* Card */}
      <FlipCard
        key={`${level}-${index}-${shuffled}`}
        card={card}
        index={index}
        total={deck.length}
        onEngage={markReviewed}
        isRtl={isRtl}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <button
          onClick={prev}
          disabled={index === 0}
          className={clsx(
            "flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all",
            index === 0
              ? "border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed bg-zinc-900/30"
              : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
          )}
        >
          {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isRtl ? "السابق" : "Previous"}
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-white tabular-nums">
            {index + 1} / {deck.length}
          </span>
          <div className="h-1 w-16 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${((index + 1) / deck.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={next}
          disabled={index === deck.length - 1}
          className={clsx(
            "flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all",
            index === deck.length - 1
              ? "border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed bg-zinc-900/30"
              : "border-amber-500/40 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/10"
          )}
        >
          {isRtl ? "التالي" : "Next"}
          {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
