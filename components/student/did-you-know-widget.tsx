"use client";

import { useState, useEffect } from "react";
import rawFacts from "@/lib/prophet-facts.json";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Fact {
  id: number;
  clean_fact: string;
  category: string;
  reference: string;
}

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

function pickRandom(exclude?: number): Fact {
  let f: Fact;
  do {
    f = FACTS[Math.floor(Math.random() * FACTS.length)];
  } while (FACTS.length > 1 && f.id === exclude);
  return f;
}

export function DidYouKnowWidget() {
  const { visible } = useWidgetCycle();
  // Start with index 0 so server and client render the same text (avoids hydration mismatch).
  // Randomize immediately after mount, then again on each cycle.
  const [fact, setFact] = useState<Fact>(FACTS[0]);

  useEffect(() => {
    setFact(pickRandom());
  }, []);

  // Swap content at the midpoint of the fade-out (while invisible)
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setFact((prev) => pickRandom(prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const shortRef = fact.reference
    .replace("Sahih al-Bukhari and Sahih Muslim", "Bukhari & Muslim")
    .replace("Sahih al-Bukhari", "Bukhari")
    .replace("Sahih Muslim", "Muslim");

  return (
    <div className="mx-3 mb-3 mt-2" role="region" aria-label="Did You Know">
      <div className="rounded-xl border border-gold/30 bg-[#1A1409] p-4 overflow-hidden relative">
        <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-gold/50" />

        <div className="pl-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-gold-light text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-gold-light uppercase tracking-widest">Did You Know?</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#E8E4F0] leading-relaxed">{fact.clean_fact}</p>
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
