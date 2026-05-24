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
      <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-gold text-xs">✦</span>
          <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">Did You Know?</span>
        </div>

        {/* Fact text — fades between facts */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
          }}
        >
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
            {fact.clean_fact}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gold/10 text-gold border border-gold/20 leading-none">
              {fact.category}
            </span>
            <span className="text-[9px] text-text-muted">· {shortRef}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
