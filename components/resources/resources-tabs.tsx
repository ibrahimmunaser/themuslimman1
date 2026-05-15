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
  /** hex accent colour for this tab */
  color: string;
}

const ACTIVE_COLOR = "#f59e0b";

const TABS: Tab[] = [
  { id: "videos",       label: "Videos",       icon: Video,          color: ACTIVE_COLOR },
  { id: "audio",        label: "Audio",         icon: Headphones,     color: ACTIVE_COLOR },
  { id: "briefings",    label: "Briefings",     icon: FileText,       color: ACTIVE_COLOR },
  { id: "slides",       label: "Slides",        icon: Layers,         color: ACTIVE_COLOR },
  { id: "infographics", label: "Infographics",  icon: Image,          color: ACTIVE_COLOR },
  { id: "mindmaps",     label: "Mind Maps",     icon: Map,            color: ACTIVE_COLOR },
  { id: "flashcards",   label: "Flashcards",    icon: Brain,          color: ACTIVE_COLOR },
  { id: "quizzes",      label: "Quizzes",       icon: ClipboardCheck, color: ACTIVE_COLOR },
  { id: "facts",        label: "Facts",         icon: BarChart2,      color: ACTIVE_COLOR },
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
    <div>
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Resource Library
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl">
            Explore the complete collection of learning materials across all 100 parts of the Seerah Masterclass
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-900/90 backdrop-blur-lg shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const c = tab.color;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap"
                  style={isActive ? {
                    color: c,
                    backgroundColor: `${c}18`,
                    border: `1px solid ${c}40`,
                    boxShadow: `0 4px 16px ${c}18`,
                  } : {
                    color: "#a1a1aa",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = c;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${c}12`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }
                  }}
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
      <div className="min-h-screen bg-[#0a0a0a]">
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
