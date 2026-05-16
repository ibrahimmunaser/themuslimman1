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
  { id: "mindmaps",     label: "Mind Maps",    icon: Map            },
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
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-text mb-1">Resource Library</h1>
        <p className="text-sm text-text-muted">
          All learning materials across the complete 100-part Seerah Masterclass
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-lg whitespace-nowrap border",
                    isActive
                      ? "text-gold bg-gold/10 border-gold/25"
                      : "text-text-secondary border-transparent hover:text-text hover:bg-surface-raised"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <div className={activeTab === "videos" ? "block" : "hidden"}>
          {videosContent}
        </div>
        <div className={activeTab === "audio" ? "block" : "hidden"}>
          {audioContent}
        </div>
        <div className={activeTab === "briefings" ? "block" : "hidden"}>
          {briefingsContent}
        </div>
        <div className={activeTab === "slides" ? "block" : "hidden"}>
          {slidesContent}
        </div>
        <div className={activeTab === "infographics" ? "block" : "hidden"}>
          {infographicsContent}
        </div>
        <div className={activeTab === "mindmaps" ? "block" : "hidden"}>
          {mindmapsContent}
        </div>
        <div className={activeTab === "flashcards" ? "block" : "hidden"}>
          {flashcardsContent}
        </div>
        <div className={activeTab === "quizzes" ? "block" : "hidden"}>
          {quizzesContent}
        </div>
        <div className={activeTab === "facts" ? "block" : "hidden"}>
          {factsContent}
        </div>
      </div>
    </div>
  );
}
