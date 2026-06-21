"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, BookOpen, FolderOpen, TrendingUp, Library, CircleUser } from "lucide-react";
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

  const tabParam = searchParams.get("tab") as TabId | null;
  const resolvedInitial: TabId =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "home";

  const [activeTab, setActiveTab] = useState<TabId>(resolvedInitial);

  // Track which tabs have ever been activated so we keep them mounted once rendered.
  // Hiding with the HTML `hidden` attribute (display:none) rather than unmounting
  // prevents FadeUp/StaggerChildren from restarting at opacity:0 on every tab switch.
  const [everMounted, setEverMounted] = useState<Set<TabId>>(() => new Set([resolvedInitial]));
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
    // 1. Mark this tab as ever-mounted so it stays in the DOM from now on.
    setEverMounted((prev) => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); return n; });
    // 2. Highlight the tab bar immediately.
    setActiveTab(id);
    // 3. Notify the sidebar so its active indicator also updates on this frame.
    isSelfDispatch.current = true;
    window.dispatchEvent(new CustomEvent("seerah:switchTab", { detail: id }));
    isSelfDispatch.current = false;
    // 4. Update the URL for deep-linking WITHOUT triggering a Next.js server re-render.
    //    Using history.replaceState keeps tab switching purely client-side — no ~1.2s
    //    server round-trip, no React pending-transition opacity flicker.
    const url = id === "home" ? "/seerah" : `/seerah?tab=${id}`;
    window.history.replaceState(null, "", url);
  }, []);

  // Listen for tab-switch events dispatched by the sidebar (not by us) so the
  // tab bar stays in sync when the user clicks a sidebar nav item.
  useEffect(() => {
    const handler = (e: Event) => {
      if (isSelfDispatch.current) return; // ignore events we dispatched
      const tabId = (e as CustomEvent<TabId>).detail;
      if (!TABS.some((t) => t.id === tabId)) return;
      setEverMounted((prev) => { if (prev.has(tabId)) return prev; const n = new Set(prev); n.add(tabId); return n; });
      setActiveTab(tabId);
      const url = tabId === "home" ? "/seerah" : `/seerah?tab=${tabId}`;
      window.history.replaceState(null, "", url);
    };
    window.addEventListener("seerah:switchTab", handler);
    return () => window.removeEventListener("seerah:switchTab", handler);
  }, []);

  const content: Record<TabId, React.ReactNode> = useMemo(() => ({
    home:      homeContent,
    lessons:   lessonsContent,
    resources: resourcesContent,
    progress:  progressContent,
  }), [homeContent, lessonsContent, resourcesContent, progressContent]);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex" role="tablist" aria-label="Course sections">
            {/* Dashboard, Lessons, Resources tabs */}
            {TABS.slice(0, 3).map((tab) => {
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

            {/* Reference tab — navigates to separate /reference page */}
            <a
              href="/reference"
              className={clsx(
                "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 py-3 sm:py-4 min-h-[44px] text-xs sm:text-sm font-medium transition-all border-b-2 border-transparent text-text-muted hover:text-text-secondary hover:border-border"
              )}
            >
              <Library className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                <span className="min-[480px]:hidden">Ref</span>
                <span className="hidden min-[480px]:inline">Reference</span>
              </span>
            </a>

            {/* Progress tab */}
            {TABS.slice(3).map((tab) => {
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

      {/* Tab panels — keep-alive: once a tab is opened it stays mounted in the DOM
          and is hidden via the HTML `hidden` attribute (display:none) rather than
          unmounting. This prevents FadeUp/StaggerChildren from restarting their
          entrance animations (opacity:0 → 1) every time you return to a tab. */}
      {TABS.map((tab) => {
        if (!everMounted.has(tab.id)) return null;
        const isActive = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            id={`tab-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            hidden={!isActive}
            className="outline-none"
          >
            {content[tab.id]}
          </div>
        );
      })}
    </div>
  );
}
