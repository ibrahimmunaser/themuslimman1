"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  TrendingUp,
  HelpCircle,
  User,
  Users,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
} from "lucide-react";

import dynamic from "next/dynamic";
import { WidgetCycleProvider } from "./widget-cycle-context";

// Lazy-load widget components so their bundled JSON data (facts, miracles, prophecies)
// does not block the initial sidebar render. ssr:false avoids hydration mismatch
// since widgets randomize content on mount anyway.
const DidYouKnowWidget = dynamic(
  () => import("./did-you-know-widget").then((m) => ({ default: m.DidYouKnowWidget })),
  { ssr: false, loading: () => null }
);
const MiraclesWidget = dynamic(
  () => import("./miracles-widget").then((m) => ({ default: m.MiraclesWidget })),
  { ssr: false, loading: () => null }
);
const PropheciesWidget = dynamic(
  () => import("./prophecies-widget").then((m) => ({ default: m.PropheciesWidget })),
  { ssr: false, loading: () => null }
);

interface StudentSidebarProps {
  userPlan: "essentials" | "complete";
  userName: string;
  activeProfileName?: string | null;
  planType?: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  tabId?: string;
}

// ACCOUNT_MENU is built dynamically inside the component so the Profiles link
// destination can depend on planType (family → /profiles picker, individual → /student/profiles).

export function StudentSidebar({
  userPlan: _userPlan,
  userName,
  activeProfileName,
  planType = "individual",
}: StudentSidebarProps) {
  const pathname = usePathname();

  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<string>("home");
  // Optimistic pending href: set on click so the link highlights before the
  // navigation completes; cleared once the pathname actually changes.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef  = useRef<HTMLElement>(null);

  // Keep local tab state in sync with URL on every navigation.
  // We read window.location.search directly (no useSearchParams) so the sidebar
  // doesn't need to be inside a Suspense boundary — it renders with the initial
  // HTML and never causes a layout-shift flash.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") ?? "home";
    setActiveTab(tab);
    setPendingHref(null);
  }, [pathname]);

  // Sync when seerah:switchTab fires
  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent<string>).detail);
    window.addEventListener("seerah:switchTab", handler);
    return () => window.removeEventListener("seerah:switchTab", handler);
  }, []);

  // Account tab in CourseDashboardTabs triggers this to open drawer
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("seerah:openMobileMenu", handler);
    return () => window.removeEventListener("seerah:openMobileMenu", handler);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Escape key closes drawer; focus returns to trigger
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  // Move focus into drawer when it opens
  useEffect(() => {
    if (mobileOpen) {
      // Small delay to allow CSS transition
      const t = setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          "a, button, [tabindex]:not([tabindex='-1'])"
        );
        firstFocusable?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [mobileOpen]);

  const closeDrawer = () => {
    setMobileOpen(false);
    triggerRef.current?.focus();
  };

  const isOnDashboard = pathname === "/seerah";

  const MAIN_MENU: MenuItem[] = [
    { id: "dashboard",  label: "Dashboard",  href: "/seerah",               icon: LayoutDashboard, tabId: "home"      },
    { id: "lessons",    label: "Lessons",    href: "/seerah?tab=lessons",   icon: BookOpen,        tabId: "lessons"   },
    { id: "resources",  label: "Resources",  href: "/seerah?tab=resources", icon: FolderOpen,      tabId: "resources" },
    { id: "progress",   label: "Progress",   href: "/seerah?tab=progress",  icon: TrendingUp,      tabId: "progress"  },
  ];

  const isFamily = planType === "family";
  const ACCOUNT_MENU: MenuItem[] = [
    { id: "help",    label: "Help",    href: "/help",    icon: HelpCircle },
    // For family plans, "Profiles" goes to the Netflix-style picker (/profiles).
    // For individual plans, it goes to the profile management page.
    { id: "settings", label: "Settings", href: "/student/settings", icon: User },
    { id: "profiles", label: "Profiles", href: isFamily ? "/profiles" : "/student/profiles", icon: Users },
    { id: "billing", label: "Billing",  href: "/billing",  icon: CreditCard },
  ];

  const isActive = (item: MenuItem) => {
    if (item.tabId !== undefined) {
      if (pathname !== "/seerah") return false;
      return item.tabId === activeTab;
    }
    if (item.href === "/learn") return pathname === "/learn";
    return pathname.startsWith(item.href);
  };

  // Extends isActive with an optimistic "pending" state so nav links highlight
  // immediately on click rather than waiting for the navigation to complete.
  const isActiveDisplay = (item: MenuItem): boolean =>
    (pendingHref !== null && item.href === pendingHref) || isActive(item);

  const handleSignOut = () => {
    // Fire-and-forget: don't block navigation on the API round-trip.
    fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };

  const handleTabSwitch = (tabId: string) => {
    window.dispatchEvent(new CustomEvent("seerah:switchTab", { detail: tabId }));
    closeDrawer();
  };

  // ── Desktop sidebar content (full nav + widgets) ───────────────────────────
  // Defined as a plain JSX variable (not a component) so that state changes in
  // StudentSidebar never cause React to unmount/remount this subtree.
  const desktopContent = (
    <>
      {/* Logo + collapse toggle (desktop only) */}
      {!collapsed && (
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <Link href="/seerah" className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/images/logodashboard.png"
              alt="Complete Seerah"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg flex-shrink-0"
              priority
            />
            <h1 className="text-sm font-bold text-text truncate">Complete Seerah</h1>
          </Link>
          {/* Collapse button — lg+ only */}
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-text-muted hover:text-text hover:bg-surface-raised transition-all flex-shrink-0"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Info + Active Profile */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-semibold text-xs">{userName.charAt(0).toUpperCase()}</span>
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

        {/* Active learner profile indicator */}
        {!collapsed && activeProfileName && (
          <div className="mt-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCircle className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span className="text-[11px] text-text-muted truncate">{activeProfileName}</span>
              </div>
              <Link
                href="/profiles"
                className="flex-shrink-0 text-[10px] font-semibold text-gold/70 hover:text-gold transition-colors whitespace-nowrap"
              >
                Switch
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Course Navigation — scrollable middle */}
      <div className="flex-1 overflow-y-auto py-3 min-h-0">
        <nav className="px-3">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Course</p>
          )}
          <div className="space-y-1">
            {MAIN_MENU.map((item) => {
              const Icon   = item.icon;
              const active = isActiveDisplay(item);
              const cls    = clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left border",
                active
                  ? "bg-gold/10 text-gold border-gold/25"
                  : "border-transparent text-text-secondary hover:text-text hover:bg-surface-raised"
              );

              if (isOnDashboard && item.tabId !== undefined) {
                return (
                  <button key={item.id} onClick={() => handleTabSwitch(item.tabId!)} className={cls}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </button>
                );
              }
              return (
                <Link key={item.id} href={item.href} onClick={() => setPendingHref(item.href)} className={cls}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {!collapsed && (
          <>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Explore</p>
            </div>
            <WidgetCycleProvider>
              <DidYouKnowWidget />
              <MiraclesWidget />
              <PropheciesWidget />
            </WidgetCycleProvider>
          </>
        )}
      </div>

      {/* Account + Sign Out — pinned footer, always visible */}
      <div className="flex-shrink-0 border-t border-border">
        <nav className="px-3 pt-2 pb-1" aria-label="Account">
          {!collapsed && (
            <p className="px-2 pt-1 pb-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Account</p>
          )}
          <div className="space-y-0.5">
            {ACCOUNT_MENU.map((item) => {
              const Icon   = item.icon;
              const active = isActiveDisplay(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setPendingHref(item.href)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                    active
                      ? "bg-gold/10 text-gold border-gold/25"
                      : "border-transparent text-text-secondary hover:text-text hover:bg-surface-raised"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="px-3 pb-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );

  // ── Mobile drawer content (account-focused; no primary nav duplication) ────
  const mobileDrawerContent = (
    <>
      {/* Drawer header — logo + close — always visible immediately */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/seerah" className="flex items-center gap-2.5" onClick={closeDrawer}>
          <Image
            src="/images/logodashboard.png"
            alt="Complete Seerah"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg flex-shrink-0"
            priority
          />
          <span className="text-sm font-bold text-text">Complete Seerah</span>
        </Link>
        <button
          onClick={closeDrawer}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Profile / access */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="text-gold font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{userName}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gold/10 text-gold border border-gold/20 mt-0.5">
                Complete Access
              </span>
            </div>
          </div>
          {/* Active learner profile */}
          {activeProfileName && (
            <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCircle className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span className="text-xs text-text-muted truncate">
                  Learning as <span className="text-text font-medium">{activeProfileName}</span>
                </span>
              </div>
              <Link
                href="/profiles"
                onClick={closeDrawer}
                className="flex-shrink-0 text-xs font-semibold text-gold/70 hover:text-gold transition-colors whitespace-nowrap"
              >
                Switch
              </Link>
            </div>
          )}
        </div>

        {/* Course nav — only when top tabs are NOT visible (i.e. not on /seerah dashboard) */}
        {!isOnDashboard && (
          <nav className="px-3 py-2 border-b border-border/50" aria-label="Course navigation">
            <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">
              Course
            </p>
            <div className="space-y-0.5">
              {MAIN_MENU.map((item) => {
                const Icon   = item.icon;
                const active = isActiveDisplay(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => { setPendingHref(item.href); closeDrawer(); }}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] border",
                      active
                        ? "bg-gold/10 text-gold border-gold/20"
                        : "border-transparent text-text-secondary hover:text-text hover:bg-surface-raised"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted/40" />
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Account actions */}
        <nav className="px-3 py-2" aria-label="Account">
          <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">
            Account
          </p>
          <div className="space-y-0.5">
            {ACCOUNT_MENU.map((item) => {
              const Icon   = item.icon;
              const active = isActiveDisplay(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => { setPendingHref(item.href); closeDrawer(); }}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] border",
                    active
                      ? "bg-gold/10 text-gold border-gold/20"
                      : "border-transparent text-text-secondary hover:text-text hover:bg-surface-raised"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted/40" />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Educational enrichment cards — compact on mobile */}
        <div className="px-3 py-2 border-t border-border/40 mt-1">
          <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">
            Explore
          </p>
          <WidgetCycleProvider>
            <DidYouKnowWidget />
            <MiraclesWidget />
            <PropheciesWidget />
          </WidgetCycleProvider>
        </div>
      </div>

      {/* Sign Out — pinned bottom */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0"
           style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Floating trigger — lesson pages only (dashboard uses Account tab) ── */}
      {!isOnDashboard && (
        <button
          ref={triggerRef}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open account menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
          // z-[70] keeps the button above the overlay (z-[55]) and drawer (z-[65])
          className="lg:hidden fixed top-3 right-3 z-[70] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-raised transition-all shadow-sm min-h-[36px]"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="text-xs font-semibold">{mobileOpen ? "Close" : "Menu"}</span>
        </button>
      )}

      {/* ── Overlay — z-[55] covers sticky tab bar (z-50) ──────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-[55] backdrop-blur-[2px]"
          onClick={closeDrawer}
          aria-hidden
        />
      )}

      {/* ── Unified sidebar ─────────────────────────────────────────────────── */}
      <aside
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={clsx(
          "fixed top-0 left-0 bottom-0 bg-surface border-r border-border flex flex-col",
          // Smooth slide on mobile; no duration on desktop (instant collapse is fine)
          "transition-transform duration-200 ease-out will-change-transform",
          // Desktop: sticky, always visible, collapsible width
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-[40]",
          // Mobile: off-canvas drawer — z-[65] sits above overlay (z-[55])
          "z-[65]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Width: on desktop use collapse state; on mobile use responsive vw cap
          collapsed
            ? "lg:w-16"
            : "lg:w-64 w-[min(320px,88vw)]"
        )}
      >
        {/* Desktop collapsed icon bar */}
        {collapsed && (
          <div className="hidden lg:flex flex-col items-center gap-2 py-3 border-b border-border">
            <Link href="/seerah" aria-label="Complete Seerah">
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
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Render mobile drawer content on mobile, desktop content on desktop */}
        <div className="lg:hidden flex flex-col flex-1 min-h-0">
          {mobileDrawerContent}
        </div>
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          {desktopContent}
        </div>
      </aside>
    </>
  );
}
