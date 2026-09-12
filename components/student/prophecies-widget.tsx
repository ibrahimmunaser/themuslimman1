"use client";

import { useState, useEffect, useMemo } from "react";
import rawProphecies from "@/lib/prophet-prophecies.json";
import rawPropheciesAr from "@/lib/prophet-prophecies-ar.json";
import rawPropheciesFr from "@/lib/prophet-prophecies-fr.json";
import { formatHadithRef } from "@/lib/localize-hadith-ref";
import type { CourseLang } from "@/lib/course-lang";
import { isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Prophecy {
  id: number;
  fact: string;
  fulfillment: string;
  reference: string;
}

const PROPHECIES_EN: Prophecy[] = rawProphecies as Prophecy[];
const PROPHECIES_AR: Prophecy[] = rawPropheciesAr as Prophecy[];
const PROPHECIES_FR: Prophecy[] = rawPropheciesFr as Prophecy[];

function pickRandom(list: Prophecy[], exclude?: number): Prophecy {
  let p: Prophecy;
  do {
    p = list[Math.floor(Math.random() * list.length)];
  } while (list.length > 1 && p.id === exclude);
  return p;
}

function propheciesForLang(lang: CourseLang): Prophecy[] {
  if (lang === "ar") return PROPHECIES_AR;
  if (lang === "fr") return PROPHECIES_FR;
  return PROPHECIES_EN;
}

export function PropheciesWidget({
  lang = "en",
  isRtl: isRtlProp,
}: {
  lang?: CourseLang;
  /** @deprecated Prefer `lang`. Kept for older call sites. */
  isRtl?: boolean;
}) {
  const isRtl = isRtlProp ?? isRtlLang(lang);
  const { visible } = useWidgetCycle();
  const prophecies = useMemo(() => propheciesForLang(lang), [lang]);
  const [prophecy, setProphecy] = useState<Prophecy>(prophecies[0]);

  useEffect(() => {
    setProphecy(pickRandom(prophecies));
  }, [prophecies]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setProphecy((prev) => pickRandom(prophecies, prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible, prophecies]);

  const displayRef = formatHadithRef(prophecy.reference, lang);
  const title = loc(lang, "Prophecies of the Prophet ﷺ", "نبوءات النبي ﷺ", "Prophéties du Prophète ﷺ");
  const aria = loc(lang, "Prophecies of the Prophet", "نبوءات النبي ﷺ", "Prophéties du Prophète");

  return (
    <div className="mx-3 mb-3" role="region" aria-label={aria}>
      <div className="rounded-xl border border-emerald-500/25 bg-[#0A1A10] p-4 overflow-hidden relative">
        <div className="absolute start-0 top-4 bottom-4 w-[2px] rounded-full bg-emerald-400/50" />

        <div className="ps-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-emerald-300 text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">{title}</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#C8F0DA] leading-relaxed" dir={isRtl ? "rtl" : undefined}>{prophecy.fact}</p>
            <p className="text-xs text-[#7ABFA0] leading-relaxed mt-1 italic" dir={isRtl ? "rtl" : undefined}>{prophecy.fulfillment}</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap" dir={isRtl ? "rtl" : undefined}>
              {displayRef && <span className="text-[10px] text-[#6AAF90]">· {displayRef}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
