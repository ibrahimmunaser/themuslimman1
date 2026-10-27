"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CourseLang } from "@/lib/course-lang";

const SiteLangContext = createContext<CourseLang>("en");

export function SiteLangProvider({
  lang,
  children,
}: {
  lang: CourseLang;
  children: ReactNode;
}) {
  return <SiteLangContext.Provider value={lang}>{children}</SiteLangContext.Provider>;
}

export function useSiteLang(): CourseLang {
  return useContext(SiteLangContext);
}
