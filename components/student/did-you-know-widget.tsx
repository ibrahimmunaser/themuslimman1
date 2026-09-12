"use client";

import { useState, useEffect, useMemo } from "react";
import rawFacts from "@/lib/prophet-facts.json";
import rawFactsAr from "@/lib/prophet-facts-ar.json";
import rawFactsFr from "@/lib/prophet-facts-fr.json";
import { formatHadithRef } from "@/lib/localize-hadith-ref";
import type { CourseLang } from "@/lib/course-lang";
import { isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
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

const FACTS_FR: Fact[] = (rawFactsFr as Array<{
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

function factsForLang(lang: CourseLang): Fact[] {
  if (lang === "ar") return FACTS_AR;
  if (lang === "fr") return FACTS_FR;
  return FACTS_EN;
}

export function DidYouKnowWidget({
  lang = "en",
  isRtl: isRtlProp,
}: {
  lang?: CourseLang;
  /** @deprecated Prefer `lang`. Kept for older call sites. */
  isRtl?: boolean;
}) {
  const isRtl = isRtlProp ?? isRtlLang(lang);
  const { visible } = useWidgetCycle();
  const facts = useMemo(() => factsForLang(lang), [lang]);
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

  const rawRef =
    lang === "en" ? fact.reference : FACTS_EN.find((f) => f.id === fact.id)?.reference;
  const displayRef = formatHadithRef(rawRef, lang);

  const title = loc(lang, "Did You Know?", "هل تعلم؟", "Le saviez-vous ?");
  const aria = loc(lang, "Did You Know", "هل تعلم؟", "Le saviez-vous");

  return (
    <div className="mx-3 mb-3 mt-2" role="region" aria-label={aria}>
      <div className="rounded-xl border border-gold/30 bg-[#1A1409] p-4 overflow-hidden relative">
        <div className="absolute start-0 top-4 bottom-4 w-[2px] rounded-full bg-gold/50" />

        <div className="ps-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-gold-light text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-gold-light uppercase tracking-widest">{title}</span>
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
