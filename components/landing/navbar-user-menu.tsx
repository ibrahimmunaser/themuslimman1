"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { NavbarUserButton } from "./navbar-user-button";
import type { CourseLang } from "@/lib/course-lang";
import { siteT } from "@/lib/site-copy";

interface NavbarUserMenuProps {
  user: { fullName: string } | null;
  firstName: string | null;
  hasPaid?: boolean;
  lang?: CourseLang;
}

function pricingHref(pathname: string): string {
  if (pathname === "/" || pathname === "/pricing") return "#pricing";
  return "/#pricing";
}

export function NavbarUserMenu({ user, firstName, hasPaid, lang = "en" }: NavbarUserMenuProps) {
  const pathname = usePathname();

  if (!user) {
    return (
      <>
        <Link href="/login" className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors">
          {siteT(lang, "navLogin")}
        </Link>
        <Link href={pricingHref(pathname)} className={`hidden md:inline-flex ${buttonClass("primary", "sm")}`}>
          {siteT(lang, "navGetStarted")}
        </Link>
      </>
    );
  }

  // Logged in - show user menu with dropdown (hidden on mobile)
  return <NavbarUserButton firstName={firstName!} hasPaid={hasPaid} />;
}
