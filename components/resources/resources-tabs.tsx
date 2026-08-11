"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, Headphones, FileText, Image, Map, Layers, Brain, ClipboardCheck, BarChart2, ChevronRight, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import type { CourseLang } from "@/lib/course-lang";
import { t } from "@/lib/ui-strings";

interface ResourcesTabsProps {
  videosContent: React.ReactNode;
  audioContent: React.ReactNode;
  briefingsContent: React.ReactNode;
  slidesContent: React.ReactNode;
  infographicsContent: React.ReactNode;
  mindmapsContent: React.ReactNode;
  flashcardsContent: React.ReactNode;
  quizzesContent: React.ReactNode;
  factsContent: React.ReactNode;
  initialLang?: CourseLang;
}

type TabId = "videos" | "audio" | "briefings" | "slides" | "infographics" | "mindmaps" | "flashcards" | "quizzes" | "facts";

interface Tab {
  id: TabId;
  labelKey: "videos" | "slides" | "infographics" | "briefings" | "facts" | "mindmapsTab" | "flashcards" | "quizzes" | "audio";
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_TABS: Tab[] = [
  { id: "videos",       labelKey: "videos",       icon: Video          },
  { id: "slides",       labelKey: "slides",       icon: Layers         },
  { id: "infographics", labelKey: "infographics", icon: Image          },
  { id: "briefings",    labelKey: "briefings",    icon: FileText       },
  { id: "facts",        labelKey: "facts",        icon: BarChart2      },
  { id: "mindmaps",     labelKey: "mindmapsTab",  icon: Map            },
  { id: "flashcards",   labelKey: "flashcards",   icon: Brain          },
  { id: "quizzes",      labelKey: "quizzes",      icon: ClipboardCheck },
  { id: "audio",        labelKey: "audio",        icon: Headphones     },
];

export function ResourcesTabs({
  videosContent,
  audioContent,
  briefingsContent,
  slidesContent,
  infographicsContent,
  mindmapsContent,
  flashcardsContent,
  quizzesContent,
  factsContent,
  initialLang = "en",
}: ResourcesTabsProps) {
  const isRtl = initialLang === "ar";
  // Hide mindmaps tab for Arabic
  const TABS = ALL_TABS.filter((tab) => !(isRtl && tab.id === "mindmaps"));
  const BreadcrumbSep = isRtl ? ChevronLeft : ChevronRight;
  const [activeTab, setActiveTab] = useState<TabId>("videos");

  return (
    <div className="w-full">
      {/* Header — compressed on mobile */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        {/* Breadcrumb — desktop only */}
        <nav aria-label={t(initialLang, "breadcrumbLabel")} className="hidden sm:flex items-center gap-1 text-xs text-text-muted mb-2">
          <Link href="/seerah" className="hover:text-text transition-colors">
            {t(initialLang, "course")}
          </Link>
          <BreadcrumbSep className="w-3 h-3 flex-shrink-0" aria-hidden />
          <span className="text-text-secondary font-medium">
            {t(initialLang, "resources")}
          </span>
          <BreadcrumbSep className="w-3 h-3 flex-shrink-0" aria-hidden />
          <span className="text-text capitalize">
            {TABS.find((tab) => tab.id === activeTab)?.labelKey ? t(initialLang, TABS.find((tab) => tab.id === activeTab)!.labelKey) : t(initialLang, "videos")}
          </span>
        </nav>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-text">{t(initialLang, "resourceLibrary")}</h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              {t(initialLang, "resourceLibSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation — sticky below the dashboard tab bar (sticky top-0 z-50, ~60px tall).
          top-[60px] mobile / sm:top-14 (56px) sm+ keeps it just below the dashboard tabs bar. */}
      <div className="sticky top-[60px] sm:top-14 z-30 border-b border-border bg-surface shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-2 sm:py-1.5">

          {/* ── Mobile: horizontal scroll strip — keeps sticky bar to ~44px ── */}
          <div
            className="sm:hidden flex gap-1.5 overflow-x-auto scrollbar-hide py-1"
            role="tablist"
            aria-label={t(initialLang, "resourceTypes")}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-1.5 flex-shrink-0 rounded-xl border",
                    "min-h-[44px] px-3 py-2 transition-all",
                    isActive
                      ? "text-gold bg-gold/8 border-gold/20"
                      : "text-text-muted border-border/40 bg-surface/50 hover:text-text-secondary hover:bg-surface-raised"
                  )}
                >
                  <Icon className={clsx("w-4 h-4 flex-shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-55")} />
                  <span className="text-[11px] font-medium whitespace-nowrap">{t(initialLang, tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* ── Desktop/tablet: horizontal strip ── */}
          <div
            className="hidden sm:flex gap-1 overflow-x-auto scrollbar-hide py-1"
            role="tablist"
            aria-label={t(initialLang, "resourceTypes")}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 text-sm font-medium",
                    "transition-all rounded-lg whitespace-nowrap border flex-shrink-0 min-h-[40px]",
                    isActive
                      ? "text-gold bg-gold/8 border-gold/20"
                      : "text-text-muted border-transparent hover:text-text-secondary hover:bg-surface-raised"
                  )}
                >
                  <Icon className={clsx("w-3.5 h-3.5 flex-shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  {t(initialLang, tab.labelKey)}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Tab Content */}
      <div>
        <div className={activeTab === "videos"       ? "block" : "hidden"}>{videosContent}</div>
        <div className={activeTab === "audio"        ? "block" : "hidden"}>{audioContent}</div>
        <div className={activeTab === "briefings"    ? "block" : "hidden"}>{briefingsContent}</div>
        <div className={activeTab === "slides"       ? "block" : "hidden"}>{slidesContent}</div>
        <div className={activeTab === "infographics" ? "block" : "hidden"}>{infographicsContent}</div>
        <div className={activeTab === "mindmaps"     ? "block" : "hidden"}>{mindmapsContent}</div>
        <div className={activeTab === "flashcards"   ? "block" : "hidden"}>{flashcardsContent}</div>
        <div className={activeTab === "quizzes"      ? "block" : "hidden"}>{quizzesContent}</div>
        <div className={activeTab === "facts"        ? "block" : "hidden"}>{factsContent}</div>
      </div>
    </div>
  );
}
