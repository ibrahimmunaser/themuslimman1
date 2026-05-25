"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const DISPLAY_DURATION_MS = 15000;
const FADE_DURATION_MS    =    600;

interface WidgetCycleContextValue {
  visible: boolean;
}

const WidgetCycleContext = createContext<WidgetCycleContextValue>({ visible: true });

export function WidgetCycleProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setVisible(true);
        timerRef.current = setTimeout(cycle, DISPLAY_DURATION_MS);
      }, FADE_DURATION_MS);
    };

    timerRef.current = setTimeout(cycle, DISPLAY_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <WidgetCycleContext.Provider value={{ visible }}>
      {children}
    </WidgetCycleContext.Provider>
  );
}

export const WIDGET_FADE_MS = FADE_DURATION_MS;
export function useWidgetCycle() {
  return useContext(WidgetCycleContext);
}
