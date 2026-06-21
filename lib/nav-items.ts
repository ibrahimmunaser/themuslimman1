import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Library,
  BarChart3,
  BarChart2,
  ShieldCheck,
  HardDrive,
  ShoppingCart,
  MessageCircle,
  BookOpen,
  Mail,
  Send,
  ClipboardList,
} from "lucide-react";
import { ROLES, type Role } from "./roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const STUDENT_NAV: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/student/classes",   label: "My Programs", icon: BookOpen },
  { href: "/student/progress",  label: "Progress",    icon: BarChart3 },
  { href: "/student/settings",  label: "Settings",    icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard",  label: "Dashboard",       icon: LayoutDashboard, exact: true },
  { href: "/admin/users",      label: "Users",           icon: UserCheck },
  { href: "/admin/students",   label: "Students",        icon: Users },
  { href: "/admin/orders",     label: "Orders",          icon: ShoppingCart },
  { href: "/admin/content",    label: "Content Library", icon: Library },
  { href: "/admin/analytics",  label: "Analytics",       icon: BarChart3 },
  { href: "/admin/support",    label: "Support",         icon: MessageCircle },
  { href: "/admin/email-outreach",   label: "Email Outreach",   icon: Send },
  { href: "/admin/email-automation", label: "Email Automation", icon: Mail },
  { href: "/admin/checkup-leads",    label: "Quiz Leads",        icon: ClipboardList },
  { href: "/admin/funnel-events",    label: "Funnel Events",     icon: BarChart2 },
  { href: "/admin/r2",         label: "R2 Storage",      icon: HardDrive },
  { href: "/admin/settings",   label: "Settings",        icon: ShieldCheck },
];

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case ROLES.STUDENT:        return STUDENT_NAV;
    case ROLES.PLATFORM_ADMIN: return ADMIN_NAV;
    default:                   return STUDENT_NAV;
  }
}
