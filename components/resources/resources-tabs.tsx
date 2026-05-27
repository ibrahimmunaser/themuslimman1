"use client";

import { useState } from "react";
import { Video, Headphones, FileText, Image, Map, Layers, Brain, ClipboardCheck, BarChart2 } from "lucide-react";
import { clsx } from "clsx";

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
}

type TabId = "videos" | "audio" | "briefings" | "slides" | "infographics" | "mindmaps" | "flashcards" | "quizzes" | "facts";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "videos",       label: "Videos",       icon: Video          },
  { id: "slides",       label: "Slides",       icon: Layers         },
  { id: "infographics", label: "Infographics", icon: Image          },
  { id: "briefings",    label: "Briefings",    icon: FileText       },
  { id: "facts",        label: "Facts",        icon: BarChart2      },
  { id: "mindmaps",     label: "Mindmaps",     icon: Map            },
  { id: "flashcards",   label: "Flashcards",   icon: Brain          },
  { id: "quizzes",      label: "Quizzes",      icon: ClipboardCheck },
  { id: "audio",        label: "Audio",        icon: Headphones     },
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
}: ResourcesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("videos");

  return (
    <div className="w-full">
      {/* Header — compressed on mobile */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <h1 className="text-lg sm:text-2xl font-bold text-text">Resource Library</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          All learning materials across the complete Seerah Masterclass
        </p>
      </div>

      {/* Tab Navigation — sticky below the dashboard tab bar.
          Dashboard tabs: flex-col+py-3 on mobile ≈ 60px; flex-row+py-4 on sm+ ≈ 52px.
          top-16 (64px) mobile / sm:top-14 (56px) sm+ ensures we clear the bar. */}
      <div className="sticky top-16 sm:top-14 z-30 border-b border-border bg-surface shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-2 sm:py-1.5">

          {/* ── Mobile: 3-column grid so all tabs are visible without scrolling ── */}
          <div
            className="sm:hidden grid grid-cols-3 gap-1.5"
            role="tablist"
            aria-label="Resource types"
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
                    "flex flex-col items-center justify-center gap-1 rounded-xl border",
                    "min-h-[52px] px-1 py-2 text-center transition-all",
                    isActive
                      ? "text-gold bg-gold/8 border-gold/20"
                      : "text-text-muted border-border/40 bg-surface/50 hover:text-text-secondary hover:bg-surface-raised"
                  )}
                >
                  <Icon className={clsx("w-4 h-4 flex-shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-55")} />
                  <span className={clsx(
                    "text-[10px] font-medium leading-tight w-full text-center",
                    // "Infographics" and "Mind Maps" are the longest — allow them to wrap cleanly
                    "break-words hyphens-none"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Desktop/tablet: horizontal strip (unchanged) ── */}
          <div
            className="hidden sm:flex gap-1.5 overflow-x-auto scrollbar-hide py-1"
            role="tablist"
            aria-label="Resource types"
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
                    "flex items-center gap-1.5 px-4 text-sm font-medium",
                    "transition-all rounded-lg whitespace-nowrap border flex-shrink-0 min-h-[44px]",
                    isActive
                      ? "text-gold bg-gold/8 border-gold/20"
                      : "text-text-muted border-transparent hover:text-text-secondary hover:bg-surface-raised"
                  )}
                >
                  <Icon className={clsx("w-3.5 h-3.5 flex-shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  {tab.label}
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
