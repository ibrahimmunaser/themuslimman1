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
  { id: "dashboard", label: "Dashboard", href: "/learn", icon: LayoutDashboard },
  { id: "my-courses", label: "My Courses", href: "/my-courses", icon: BookOpen },
  { id: "resources", label: "Resources", href: "/student/resources", icon: FolderOpen },
  { id: "progress", label: "Progress", href: "/student/progress", icon: TrendingUp },
  { id: "help", label: "Help", href: "/help", icon: HelpCircle },
];

const ACCOUNT_MENU: MenuItem[] = [
  { id: "settings", label: "Settings", href: "/student/settings", icon: User },
  { id: "billing", label: "Upgrade", href: "/pricing", icon: CreditCard },
];

export function StudentSidebar({ userPlan, userName }: StudentSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <p className="text-[10px] text-text-muted capitalize">
                {userPlan === "complete" ? "Complete" : "Essentials"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-0.5 px-2">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-gold/10 text-gold border border-gold/25"
                    : "text-text-secondary hover:text-text hover:bg-surface-raised"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
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

          {/* Divider */}
          <div className="my-2 border-t border-border" />

          {/* Account Section */}
          {ACCOUNT_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-gold/10 text-gold border border-gold/25"
                    : "text-text-secondary hover:text-text hover:bg-surface-raised"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-raised transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
          </button>
        </nav>

        {/* Upgrade CTA for Essentials users */}
        {userPlan === "essentials" && !collapsed && (
          <div className="mx-2 mt-2 p-3 rounded-lg bg-gold/10 border border-gold/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <h3 className="text-xs font-bold text-text">Upgrade to Complete</h3>
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed mb-2">
              Get 100 parts, mind maps, flashcards & more
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center px-3 py-1.5 rounded-md bg-gold text-ink text-xs font-semibold hover:bg-gold/90 transition-colors"
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

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col bg-surface border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-3">
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

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "lg:hidden fixed top-0 left-0 bottom-0 z-40 w-56 bg-surface border-r border-border flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
