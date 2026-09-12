"use client";

import { useState, useEffect, useMemo } from "react";
import rawMiracles from "@/lib/prophet-miracles.json";
import rawMiraclesAr from "@/lib/prophet-miracles-ar.json";
import rawMiraclesFr from "@/lib/prophet-miracles-fr.json";
import { formatHadithRef } from "@/lib/localize-hadith-ref";
import type { CourseLang } from "@/lib/course-lang";
import { isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Miracle {
  id: number;
  fact: string;
  type: string;
  reference: string;
}

const MIRACLES_EN: Miracle[] = rawMiracles as Miracle[];
const MIRACLES_AR: Miracle[] = rawMiraclesAr as Miracle[];
const MIRACLES_FR: Miracle[] = rawMiraclesFr as Miracle[];

function pickRandom(list: Miracle[], exclude?: number): Miracle {
  let m: Miracle;
  do {
    m = list[Math.floor(Math.random() * list.length)];
  } while (list.length > 1 && m.id === exclude);
  return m;
}

function miraclesForLang(lang: CourseLang): Miracle[] {
  if (lang === "ar") return MIRACLES_AR;
  if (lang === "fr") return MIRACLES_FR;
  return MIRACLES_EN;
}

export function MiraclesWidget({
  lang = "en",
  isRtl: isRtlProp,
}: {
  lang?: CourseLang;
  /** @deprecated Prefer `lang`. Kept for older call sites. */
  isRtl?: boolean;
}) {
  const isRtl = isRtlProp ?? isRtlLang(lang);
  const { visible } = useWidgetCycle();
  const miracles = useMemo(() => miraclesForLang(lang), [lang]);
  const [miracle, setMiracle] = useState<Miracle>(miracles[0]);

  useEffect(() => {
    setMiracle(pickRandom(miracles));
  }, [miracles]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setMiracle((prev) => pickRandom(miracles, prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible, miracles]);

  const displayRef = formatHadithRef(miracle.reference, lang);
  const title = loc(lang, "Miracles of the Prophet ﷺ", "معجزات النبي ﷺ", "Miracles du Prophète ﷺ");
  const aria = loc(lang, "Miracles of the Prophet", "معجزات النبي ﷺ", "Miracles du Prophète");

  return (
    <div className="mx-3 mb-3" role="region" aria-label={aria}>
      <div className="rounded-xl border border-sky-500/25 bg-[#0A1520] p-4 overflow-hidden relative">
        <div className="absolute start-0 top-4 bottom-4 w-[2px] rounded-full bg-sky-400/50" />

        <div className="ps-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-sky-300 text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-widest">{title}</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#C8E4F8] leading-relaxed" dir={isRtl ? "rtl" : undefined}>{miracle.fact}</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap" dir={isRtl ? "rtl" : undefined}>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25 leading-none">
                {miracle.type}
              </span>
              {displayRef && <span className="text-[10px] text-[#7AAAC4]">· {displayRef}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
