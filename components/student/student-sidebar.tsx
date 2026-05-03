"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FolderOpen,
  ClipboardCheck,
  TrendingUp,
  Award,
  HelpCircle,
  User,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

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
}

const MAIN_MENU: MenuItem[] = [
  { id: "my-courses", label: "My Courses", href: "/my-courses", icon: BookOpen },
  { id: "help", label: "Help", href: "/help", icon: HelpCircle },
];

const ACCOUNT_MENU_BASE: MenuItem[] = [
  { id: "settings", label: "Settings", href: "/student/settings", icon: User },
];

export function StudentSidebar({ userPlan, userName }: StudentSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Dynamic billing/upgrade link based on user plan
  const billingHref = userPlan === "essentials" ? "/upgrade" : "/pricing";
  
  const ACCOUNT_MENU: MenuItem[] = [
    ...ACCOUNT_MENU_BASE,
    { id: "billing", label: "Billing / Upgrade", href: billingHref, icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === "/learn") {
      return pathname === "/learn";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <Link href="/my-courses" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="text-gold font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text">Seerah LMS</h1>
            </div>
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
                {userPlan === "complete" ? "Complete Plan" : "Essentials Plan"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-1 px-3">
          {/* Main Menu Section */}
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-text-muted mb-2">
              Main Menu
            </p>
          )}
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

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

          {/* Account Section */}
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-text-muted mt-6 mb-2">
              Account
            </p>
          )}
          {ACCOUNT_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-raised transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
          </button>
        </nav>

        {/* Upgrade CTA for Essentials users */}
        {userPlan === "essentials" && !collapsed && (
          <div className="mx-2 mt-2 p-3 rounded-lg bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <h3 className="text-sm font-bold text-text">Upgrade to Complete</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Unlock all 100 parts, mind maps, flashcards, slides, infographics, and expanded lessons.
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-raised transition-all"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

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
          // Mobile: slide in/out
          "lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: collapsible width
          collapsed ? "lg:w-16" : "w-64"
        )}
      >
        {collapsed ? (
          <div className="hidden lg:flex flex-col items-center py-3">
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
