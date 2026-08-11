"use client";

import { useState, useEffect, useMemo } from "react";
import rawFacts from "@/lib/prophet-facts.json";
import rawFactsAr from "@/lib/prophet-facts-ar.json";
import { formatHadithRef } from "@/lib/localize-hadith-ref";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Fact {
  id: number;
  clean_fact: string;
  category: string;
  reference?: string;
}

const FACTS_EN: Fact[] = (rawFacts as Array<{
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

const FACTS_AR: Fact[] = (rawFactsAr as Array<{
  id: number;
  clean_fact: string;
  category: string;
}>).map(({ id, clean_fact, category }) => ({
  id,
  clean_fact,
  category,
}));

function pickRandom(list: Fact[], exclude?: number): Fact {
  let f: Fact;
  do {
    f = list[Math.floor(Math.random() * list.length)];
  } while (list.length > 1 && f.id === exclude);
  return f;
}

export function DidYouKnowWidget({ isRtl }: { isRtl?: boolean }) {
  const { visible } = useWidgetCycle();
  const facts = useMemo(() => (isRtl ? FACTS_AR : FACTS_EN), [isRtl]);
  const [fact, setFact] = useState<Fact>(facts[0]);

  useEffect(() => {
    setFact(pickRandom(facts));
  }, [facts]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setFact((prev) => pickRandom(facts, prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible, facts]);

  const rawRef = isRtl
    ? FACTS_EN.find((f) => f.id === fact.id)?.reference
    : fact.reference;
  const displayRef = formatHadithRef(rawRef, isRtl);

  return (
    <div className="mx-3 mb-3 mt-2" role="region" aria-label={isRtl ? "هل تعلم؟" : "Did You Know"}>
      <div className="rounded-xl border border-gold/30 bg-[#1A1409] p-4 overflow-hidden relative">
        <div className="absolute start-0 top-4 bottom-4 w-[2px] rounded-full bg-gold/50" />

        <div className="ps-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-gold-light text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-gold-light uppercase tracking-widest">{isRtl ? "هل تعلم؟" : "Did You Know?"}</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#E8E4F0] leading-relaxed" dir={isRtl ? "rtl" : undefined}>{fact.clean_fact}</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap" dir={isRtl ? "rtl" : undefined}>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gold/20 text-gold border border-gold/30 leading-none">
                {fact.category}
              </span>
              {displayRef && <span className="text-[10px] text-[#9E9AAC]">· {displayRef}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
