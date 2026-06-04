"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, FolderOpen, TrendingUp, CircleUser } from "lucide-react";
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
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "home",      label: "Dashboard", shortLabel: "Home",    icon: LayoutDashboard },
  { id: "lessons",   label: "Lessons",   shortLabel: "Lessons", icon: BookOpen },
  { id: "resources", label: "Resources", shortLabel: "Media",   icon: FolderOpen },
  { id: "progress",  label: "Progress",  shortLabel: "Stats",   icon: TrendingUp },
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
  const [, startTransition] = useTransition();
  // Tracks whether the current seerah:switchTab event was dispatched by us so
  // we can skip it in our own listener and avoid double-routing.
  const isSelfDispatch = useRef(false);

  // Sync tab state when URL changes (browser back / forward / direct link)
  useEffect(() => {
    const incoming = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "home";
    if (incoming !== activeTab) setActiveTab(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const switchTab = useCallback((id: TabId) => {
    // 1. Highlight the tab bar immediately.
    setActiveTab(id);
    // 2. Notify the sidebar so its active indicator also updates on this frame.
    //    dispatchEvent is synchronous, so the flag prevents our own listener
    //    from re-entering (and double-routing) when it receives the event.
    isSelfDispatch.current = true;
    window.dispatchEvent(new CustomEvent("seerah:switchTab", { detail: id }));
    isSelfDispatch.current = false;
    // 3. Route in the background — marked non-urgent so React commits the
    //    visual update above before waiting on the navigation.
    startTransition(() => {
      const url = id === "home" ? "/seerah" : `/seerah?tab=${id}`;
      router.replace(url, { scroll: false });
    });
  }, [router, startTransition]);

  // Listen for tab-switch events dispatched by the sidebar (not by us) so the
  // tab bar stays in sync when the user clicks a sidebar nav item.
  useEffect(() => {
    const handler = (e: Event) => {
      if (isSelfDispatch.current) return; // ignore events we dispatched
      const tabId = (e as CustomEvent<TabId>).detail;
      if (!TABS.some((t) => t.id === tabId)) return;
      setActiveTab(tabId);
      startTransition(() => {
        const url = tabId === "home" ? "/seerah" : `/seerah?tab=${tabId}`;
        router.replace(url, { scroll: false });
      });
    };
    window.addEventListener("seerah:switchTab", handler);
    return () => window.removeEventListener("seerah:switchTab", handler);
  }, [router, startTransition]);

  const content: Record<TabId, React.ReactNode> = {
    home:      homeContent,
    lessons:   lessonsContent,
    resources: resourcesContent,
    progress:  progressContent,
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex" role="tablist" aria-label="Course sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tab-panel-${tab.id}`}
                  onClick={() => switchTab(tab.id)}
                  className={clsx(
                    "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 py-3 sm:py-4 min-h-[44px] text-xs sm:text-sm font-medium transition-all border-b-2",
                    isActive
                      ? "border-gold text-gold"
                      : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    <span className="min-[480px]:hidden">{tab.shortLabel}</span>
                    <span className="hidden min-[480px]:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}

            {/* Account tab — mobile only; opens the sidebar account section */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("seerah:openMobileMenu"))}
              className={clsx(
                "lg:hidden flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-3 sm:py-4 min-h-[44px] text-xs sm:text-sm font-medium transition-all border-b-2 border-transparent text-text-muted hover:text-text-secondary hover:border-border"
              )}
              aria-label="Open account menu"
            >
              <CircleUser className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Acct</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content — panel id matches aria-controls on each tab button */}
      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="outline-none"
      >
        {content[activeTab]}
      </div>
    </div>
  );
}
