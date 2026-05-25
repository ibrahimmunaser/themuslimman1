"use client";

import { useState, useEffect } from "react";
import rawMiracles from "@/lib/prophet-miracles.json";
import { useWidgetCycle, WIDGET_FADE_MS } from "./widget-cycle-context";

interface Miracle {
  id: number;
  fact: string;
  type: string;
  reference: string;
}

const MIRACLES: Miracle[] = rawMiracles as Miracle[];

function pickRandom(exclude?: number): Miracle {
  let m: Miracle;
  do {
    m = MIRACLES[Math.floor(Math.random() * MIRACLES.length)];
  } while (MIRACLES.length > 1 && m.id === exclude);
  return m;
}

export function MiraclesWidget() {
  const { visible } = useWidgetCycle();
  const [miracle, setMiracle] = useState<Miracle>(() => pickRandom());

  // Swap content at the midpoint of the fade-out (while invisible)
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setMiracle((prev) => pickRandom(prev.id));
      }, WIDGET_FADE_MS / 2);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div className="mx-3 mb-3">
      <div className="rounded-xl border border-sky-500/25 bg-[#0A1520] p-4 overflow-hidden relative">
        <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-sky-400/50" />

        <div className="pl-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-sky-300 text-sm leading-none">✦</span>
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-widest">Miracles of the Prophet ﷺ</span>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${WIDGET_FADE_MS}ms ease-in-out` }}>
            <p className="text-xs text-[#C8E4F8] leading-relaxed">{miracle.fact}</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25 leading-none">
                {miracle.type}
              </span>
              <span className="text-[10px] text-[#7AAAC4]">· {miracle.reference}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
