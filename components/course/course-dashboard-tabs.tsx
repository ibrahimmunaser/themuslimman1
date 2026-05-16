"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, FolderOpen, TrendingUp } from "lucide-react";
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
  { id: "home",      label: "Dashboard", icon: LayoutDashboard },
  { id: "lessons",   label: "Lessons",   icon: BookOpen },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "progress",  label: "Progress",  icon: TrendingUp },
];

export function CourseDashboardTabs({
  homeContent,
  lessonsContent,
  resourcesContent,
  progressContent,
}: CourseDashboardTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as TabId | null;
  const resolvedInitial: TabId =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "home";

  const [activeTab, setActiveTab] = useState<TabId>(resolvedInitial);

  // Sync tab state when URL changes (browser back / forward / direct link)
  useEffect(() => {
    const incoming = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "home";
    if (incoming !== activeTab) setActiveTab(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    const url = id === "home" ? "/seerah" : `/seerah?tab=${id}`;
    router.replace(url, { scroll: false });
  };

  const content: Record<TabId, React.ReactNode> = {
    home:      homeContent,
    lessons:   lessonsContent,
    resources: resourcesContent,
    progress:  progressContent,
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pr-12 sm:pr-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all border-b-2 flex-shrink-0 whitespace-nowrap",
                    isActive
                      ? "border-gold text-gold"
                      : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
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
