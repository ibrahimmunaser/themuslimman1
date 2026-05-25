"use client";

import { useState, useEffect, useRef } from "react";
import rawFacts from "@/lib/prophet-facts.json";

interface Fact {
  id: number;
  clean_fact: string;
  category: string;
  reference: string;
}

// Strip to only what the UI needs to keep the bundle lean
const FACTS: Fact[] = (rawFacts as Array<{
  id: number;
  clean_fact: string;
  category: string;
  reference: string;
}>).map(({ id, clean_fact, category, reference }) => ({
  id,
  clean_fact,
  category,
  reference,
}));

const DISPLAY_DURATION_MS = 14000; // time the fact is shown
const FADE_DURATION_MS    =   600; // CSS fade duration

function pickRandom(exclude?: number): Fact {
  let f: Fact;
  do {
    f = FACTS[Math.floor(Math.random() * FACTS.length)];
  } while (FACTS.length > 1 && f.id === exclude);
  return f;
}

export function DidYouKnowWidget() {
  const [fact, setFact]       = useState<Fact>(() => pickRandom());
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      // Fade out
      setVisible(false);
      timerRef.current = setTimeout(() => {
        // Swap fact while invisible
        setFact((prev) => pickRandom(prev.id));
        // Fade in
        setVisible(true);
        // Schedule next cycle
        timerRef.current = setTimeout(cycle, DISPLAY_DURATION_MS);
      }, FADE_DURATION_MS);
    };

    timerRef.current = setTimeout(cycle, DISPLAY_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Shorten very long references for display
  const shortRef = fact.reference.replace("Sahih al-Bukhari and Sahih Muslim", "Bukhari & Muslim")
    .replace("Sahih al-Bukhari", "Bukhari")
    .replace("Sahih Muslim", "Muslim");

  return (
    <div className="mx-3 mb-3 mt-2">
      <div className="rounded-xl border border-gold/30 bg-[#1A1409] p-4 overflow-hidden relative">
        {/* Subtle left accent bar */}
        <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-gold/50" />

        <div className="pl-3.5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-gold-light text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-gold-light uppercase tracking-widest">Did You Know?</span>
          </div>

          {/* Fact text — fades between facts */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
            }}
          >
            <p className="text-xs text-[#E8E4F0] leading-relaxed line-clamp-5">
              {fact.clean_fact}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gold/20 text-gold border border-gold/30 leading-none">
                {fact.category}
              </span>
              <span className="text-[10px] text-[#9E9AAC]">· {shortRef}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
