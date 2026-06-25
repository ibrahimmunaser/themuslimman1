"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { NavbarUserButton } from "./navbar-user-button";

interface NavbarUserMenuProps {
  user: { fullName: string } | null;
  firstName: string | null;
  hasPaid?: boolean;
}

function pricingHref(pathname: string): string {
  if (pathname === "/" || pathname === "/pricing") return "#pricing";
  return "/#pricing";
}

export function NavbarUserMenu({ user, firstName, hasPaid }: NavbarUserMenuProps) {
  const pathname = usePathname();

  if (!user) {
    // Not logged in - show Login button (hidden on mobile)
    return (
      <>
        <Link href="/login" className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors">
          Login
        </Link>
        <Link href={pricingHref(pathname)} className={`hidden md:inline-flex ${buttonClass("primary", "sm")}`}>
          Get Started
        </Link>
      </>
    );
  }

  // Logged in - show user menu with dropdown (hidden on mobile)
  return <NavbarUserButton firstName={firstName!} hasPaid={hasPaid} />;
}
