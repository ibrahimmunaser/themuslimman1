"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  TrendingUp,
  HelpCircle,
  User,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { DidYouKnowWidget } from "./did-you-know-widget";

interface StudentSidebarProps {
  userPlan: "essentials" | "complete";
  userName: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  tabId?: string; // for /seerah?tab=X links
}

const ACCOUNT_MENU_BASE: MenuItem[] = [
  { id: "settings", label: "Settings", href: "/student/settings", icon: User },
];

export function StudentSidebar({ userPlan, userName }: StudentSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Mirror the active tab in local state so it updates in sync with CourseDashboardTabs
  const [activeTab, setActiveTab] = useState<string>(activeTabParam ?? "home");

  // Keep local state in sync with URL (browser back/forward)
  useEffect(() => {
    setActiveTab(activeTabParam ?? "home");
  }, [activeTabParam]);

  // Update instantly when the sidebar (or anything else) fires seerah:switchTab
  useEffect(() => {
    const handler = (e: Event) => {
      const tabId = (e as CustomEvent<string>).detail;
      setActiveTab(tabId);
    };
    window.addEventListener("seerah:switchTab", handler);
    return () => window.removeEventListener("seerah:switchTab", handler);
  }, []);

  // Listen for Account-tab trigger dispatched by CourseDashboardTabs
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("seerah:openMobileMenu", handler);
    return () => window.removeEventListener("seerah:openMobileMenu", handler);
  }, []);

  // On /seerah dashboard the Account tab handles menu access; hide the floating button there.
  // On lesson pages (/seerah/part-1 etc.) the floating button remains the entry point.
  const isOnDashboard = pathname === "/seerah";

  const MAIN_MENU: MenuItem[] = [
    { id: "dashboard",  label: "Dashboard",  href: "/seerah",               icon: LayoutDashboard, tabId: "home" },
    { id: "lessons",    label: "Lessons",    href: "/seerah?tab=lessons",   icon: BookOpen,        tabId: "lessons" },
    { id: "resources",  label: "Resources",  href: "/seerah?tab=resources", icon: FolderOpen,      tabId: "resources" },
    { id: "progress",   label: "Progress",   href: "/seerah?tab=progress",  icon: TrendingUp,      tabId: "progress" },
  ];

  const ACCOUNT_MENU: MenuItem[] = [
    { id: "help",    label: "Help",     href: "/help",              icon: HelpCircle },
    ...ACCOUNT_MENU_BASE,
    { id: "billing", label: "Billing",  href: "/billing",           icon: CreditCard },
  ];

  const isActive = (item: MenuItem) => {
    // Tab-based /seerah items: match pathname AND the synced local tab state
    if (item.tabId !== undefined) {
      if (pathname !== "/seerah") return false;
      return item.tabId === activeTab;
    }
    // Standard page links
    if (item.href === "/learn") return pathname === "/learn";
    return pathname.startsWith(item.href);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  const handleTabSwitch = (tabId: string) => {
    window.dispatchEvent(new CustomEvent("seerah:switchTab", { detail: tabId }));
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <Link href="/my-courses" className="flex items-center gap-2.5">
            <Image
              src="/images/logodashboard.png"
              alt="Complete Seerah"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg flex-shrink-0"
              priority
            />
            <h1 className="text-sm font-bold text-text">Complete Seerah</h1>
          </Link>
        </div>
      )}

      {/* User Info */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-semibold text-xs">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">{userName}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gold/10 text-gold border border-gold/20 mt-1">
                Complete Access
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-3">
          {/* Course Section */}
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
              Course
            </p>
          )}
          <div className="space-y-1">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const itemClass = clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left",
                active
                  ? "bg-gold/10 text-gold border border-gold/25"
                  : "text-text-secondary hover:text-text hover:bg-surface-raised"
              );

              // When already on /seerah, switch tabs instantly via event (no server round-trip)
              if (isOnDashboard && item.tabId !== undefined) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSwitch(item.tabId!)}
                    className={itemClass}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              }

              // On other pages: navigate normally to /seerah?tab=X
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={itemClass}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Account Section */}
          <div className={clsx("border-t border-border", collapsed ? "mt-3 pt-3" : "mt-5 pt-4")}>
            {!collapsed && (
              <p className="px-2 text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                Account
              </p>
            )}
            <div className="space-y-1">
              {ACCOUNT_MENU.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-gold/10 text-gold border border-gold/25"
                        : "text-text-secondary hover:text-text hover:bg-surface-raised"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-red-400 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
              </button>
            </div>
          </div>
        </nav>

        {/* Did You Know widget — directly below Sign Out, hidden when collapsed */}
        {!collapsed && <DidYouKnowWidget />}
      </div>
    </>
  );

  return (
    <>
      {/* Floating Menu button — shown on lesson pages where the Account tab isn't present.
          Hidden on /seerah dashboard where the Account tab in the top nav handles this. */}
      {!isOnDashboard && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-raised transition-all shadow-sm"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="text-xs font-semibold">{mobileOpen ? "Close" : "Menu"}</span>
        </button>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Unified Sidebar - Desktop & Mobile */}
      <aside
        className={clsx(
          "fixed top-0 left-0 bottom-0 z-40 bg-surface border-r border-border flex flex-col transition-all duration-300",
          // Desktop: sticky column frozen at top, full viewport height
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: collapsible width
          collapsed ? "lg:w-16" : "w-64"
        )}
      >
        {collapsed ? (
          <div className="hidden lg:flex flex-col items-center gap-2 py-3 border-b border-border">
            <Link href="/my-courses" aria-label="Complete Seerah">
              <Image
                src="/images/logodashboard.png"
                alt="Complete Seerah"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg"
                priority
              />
            </Link>
            <button
              onClick={() => setCollapsed(false)}
              className="w-8 h-8 rounded-lg bg-surface-raised hover:bg-surface-high flex items-center justify-center text-text-muted hover:text-text transition-all"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : null}
        <SidebarContent />
      </aside>
    </>
  );
}
