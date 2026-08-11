"use client";

import { useState, useEffect, useMemo } from "react";
import rawMiracles from "@/lib/prophet-miracles.json";
import rawMiraclesAr from "@/lib/prophet-miracles-ar.json";
import { formatHadithRef } from "@/lib/localize-hadith-ref";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Miracle {
  id: number;
  fact: string;
  type: string;
  reference: string;
}

const MIRACLES_EN: Miracle[] = rawMiracles as Miracle[];
const MIRACLES_AR: Miracle[] = rawMiraclesAr as Miracle[];

function pickRandom(list: Miracle[], exclude?: number): Miracle {
  let m: Miracle;
  do {
    m = list[Math.floor(Math.random() * list.length)];
  } while (list.length > 1 && m.id === exclude);
  return m;
}

export function MiraclesWidget({ isRtl }: { isRtl?: boolean }) {
  const { visible } = useWidgetCycle();
  const miracles = useMemo(() => (isRtl ? MIRACLES_AR : MIRACLES_EN), [isRtl]);
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

  const displayRef = formatHadithRef(miracle.reference, isRtl);

  return (
    <div className="mx-3 mb-3" role="region" aria-label={isRtl ? "معجزات النبي ﷺ" : "Miracles of the Prophet"}>
      <div className="rounded-xl border border-sky-500/25 bg-[#0A1520] p-4 overflow-hidden relative">
        <div className="absolute start-0 top-4 bottom-4 w-[2px] rounded-full bg-sky-400/50" />

        <div className="ps-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-sky-300 text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-widest">{isRtl ? "معجزات النبي ﷺ" : "Miracles of the Prophet ﷺ"}</span>
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
