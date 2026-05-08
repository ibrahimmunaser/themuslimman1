"use client";

import { useState } from "react";
import { Video, Headphones, FileText, Image, Map, Layers, Brain, ClipboardCheck, GraduationCap, BarChart2 } from "lucide-react";
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
  studyGuidesContent: React.ReactNode;
  factsContent: React.ReactNode;
}

type TabId = "videos" | "audio" | "briefings" | "slides" | "infographics" | "mindmaps" | "flashcards" | "quizzes" | "study-guides" | "facts";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "videos", label: "Videos", icon: Video },
  { id: "audio", label: "Audio", icon: Headphones },
  { id: "briefings", label: "Briefings", icon: FileText },
  { id: "slides", label: "Slides", icon: Layers },
  { id: "infographics", label: "Infographics", icon: Image },
  { id: "mindmaps", label: "Mind Maps", icon: Map },
  { id: "flashcards", label: "Flashcards", icon: Brain },
  { id: "quizzes", label: "Quizzes", icon: ClipboardCheck },
  { id: "study-guides", label: "Study Guides", icon: GraduationCap },
  { id: "facts", label: "Facts", icon: BarChart2 },
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
  studyGuidesContent,
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
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2.5 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap",
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
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
        <div className={activeTab === "study-guides" ? "block" : "hidden"}>
          {studyGuidesContent}
        </div>
        <div className={activeTab === "facts" ? "block" : "hidden"}>
          {factsContent}
        </div>
      </div>
    </div>
  );
}
