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
  { id: "lessons", label: "Lessons", href: "/learn", icon: GraduationCap },
  { id: "resources", label: "Resources", href: "/student/resources", icon: FolderOpen },
  { id: "quizzes", label: "Quizzes", href: "/student/quizzes", icon: ClipboardCheck },
  { id: "progress", label: "Progress", href: "/student/progress", icon: TrendingUp },
  { id: "certificate", label: "Certificate", href: "/student/certificate", icon: Award, badge: "Soon" },
  { id: "help", label: "Help / FAQ", href: "/help", icon: HelpCircle },
];

const ACCOUNT_MENU: MenuItem[] = [
  { id: "settings", label: "Profile & Settings", href: "/student/settings", icon: User },
  { id: "billing", label: "Billing / Upgrade", href: "/pricing", icon: CreditCard },
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
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{userName}</p>
              <p className="text-xs text-text-muted capitalize">
                {userPlan === "complete" ? "Complete Plan" : "Essentials Plan"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {/* Main Section */}
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
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
            <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mt-6 mb-2">
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
          <div className="mx-3 mt-6 p-4 rounded-xl bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-text mb-1">Upgrade to Complete</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Unlock the full 100-part mastery system with mind maps, flashcards, slides, infographics, and expanded lessons.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition-colors"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!collapsed && (
        <div className="hidden lg:block p-3 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-raised transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Collapse</span>
          </button>
        </div>
      )}
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
          collapsed ? "w-20" : "w-64"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-4">
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 rounded-lg bg-surface-raised hover:bg-surface-high flex items-center justify-center text-text-muted hover:text-text transition-all"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : null}
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
