"use client";

import { useState } from "react";
import { Home, BookOpen, FolderOpen, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

interface CourseDashboardTabsProps {
  homeContent: React.ReactNode;
  lessonsContent: React.ReactNode;
  resourcesContent: React.ReactNode;
  progressContent: React.ReactNode;
}

type TabId = "home" | "lessons" | "resources" | "progress";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export function CourseDashboardTabs({
  homeContent,
  lessonsContent,
  resourcesContent,
  progressContent,
}: CourseDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const content = {
    home: homeContent,
    lessons: lessonsContent,
    resources: resourcesContent,
    progress: progressContent,
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2",
                    isActive
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"
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
        {content[activeTab]}
      </div>
    </div>
  );
}
