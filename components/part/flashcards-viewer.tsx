"use client";

import { useState, useCallback } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { FlashcardSet, FlashcardLevel, Flashcard } from "@/lib/types";

interface FlashcardsViewerProps {
  flashcards: FlashcardSet;
}

const LEVELS: { id: FlashcardLevel; label: string }[] = [
  { id: "easy",   label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "full",   label: "Full" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function FlipCard({ card, index, total }: { card: Flashcard; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-400">
          Card {index + 1} of {total}
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
            <span className="text-xs text-zinc-500 ml-2">+{total - 20}</span>
          )}
        </div>
      </div>

      {/* Flip card */}
      <div
        className="relative cursor-pointer select-none group"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "280px",
          }}
        >
          {/* Front — question */}
          <div
            className="absolute inset-0 flex flex-col justify-center items-center rounded-2xl border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-8 sm:p-10 shadow-xl group-hover:border-amber-500/30 transition-colors"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold tracking-wider uppercase text-amber-400">
                Question
              </span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-white leading-relaxed text-center max-w-2xl">
              {card.side1}
            </p>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-amber-400/80 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span>Click to reveal answer</span>
            </div>
          </div>

          {/* Back — answer */}
          <div
            className="absolute inset-0 flex flex-col justify-center items-center rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 p-8 sm:p-10 shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase text-amber-300">
                Answer
              </span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-white leading-relaxed text-center max-w-2xl mb-6">
              {card.side2}
            </p>
            {card.tags.length > 0 && (
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
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlashcardsViewer({ flashcards }: FlashcardsViewerProps) {
  const [level, setLevel] = useState<FlashcardLevel>("easy");
  const [index, setIndex] = useState(0);
  const [deck, setDeck] = useState<Flashcard[]>(flashcards.easy);
  const [shuffled, setShuffled] = useState(false);

  const switchLevel = useCallback((newLevel: FlashcardLevel) => {
    setLevel(newLevel);
    setIndex(0);
    setShuffled(false);
    setDeck(flashcards[newLevel]);
  }, [flashcards]);

  const handleShuffle = () => {
    setDeck(shuffleArray(deck));
    setIndex(0);
    setShuffled(true);
  };

  const handleReset = () => {
    setDeck(flashcards[level]);
    setIndex(0);
    setShuffled(false);
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(deck.length - 1, i + 1));

  const card = deck[index];

  if (!card) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-400 text-base">No flashcards available for this level.</p>
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
                {l.label}
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
              Reset Order
            </button>
          ) : (
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          )}
        </div>
      </div>

      {/* Card */}
      <FlipCard key={`${level}-${index}-${shuffled}`} card={card} index={index} total={deck.length} />

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
          <ChevronLeft className="w-4 h-4" />
          Previous
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
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
