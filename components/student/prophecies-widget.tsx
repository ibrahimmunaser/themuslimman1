"use client";

import { useState, useEffect } from "react";
import rawProphecies from "@/lib/prophet-prophecies.json";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Prophecy {
  id: number;
  fact: string;
  fulfillment: string;
  reference: string;
}

const PROPHECIES: Prophecy[] = rawProphecies as Prophecy[];

function pickRandom(exclude?: number): Prophecy {
  let p: Prophecy;
  do {
    p = PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)];
  } while (PROPHECIES.length > 1 && p.id === exclude);
  return p;
}

export function PropheciesWidget() {
  const { visible } = useWidgetCycle();
  const [prophecy, setProphecy] = useState<Prophecy>(PROPHECIES[0]);

  useEffect(() => {
    setProphecy(pickRandom());
  }, []);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setProphecy((prev) => pickRandom(prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div className="mx-3 mb-3">
      <div className="rounded-xl border border-emerald-500/25 bg-[#0A1A10] p-4 overflow-hidden relative">
        <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-emerald-400/50" />

        <div className="pl-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-emerald-300 text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">Prophecies of the Prophet ﷺ</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#C8F0DA] leading-relaxed">{prophecy.fact}</p>
            <p className="text-xs text-[#7ABFA0] leading-relaxed mt-1 italic">{prophecy.fulfillment}</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[10px] text-[#6AAF90]">· {prophecy.reference}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
