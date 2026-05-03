"use client";

import { useState } from "react";
import { BookOpen, FolderOpen, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

interface CourseDashboardTabsProps {
  lessonsContent: React.ReactNode;
  resourcesContent: React.ReactNode;
  progressContent: React.ReactNode;
}

type TabId = "lessons" | "resources" | "progress";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export function CourseDashboardTabs({
  lessonsContent,
  resourcesContent,
  progressContent,
}: CourseDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("lessons");

  const content = {
    lessons: lessonsContent,
    resources: resourcesContent,
    progress: progressContent,
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
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
