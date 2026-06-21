"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { NavbarUserButton } from "./navbar-user-button";

interface NavbarUserMenuProps {
  user: { fullName: string } | null;
  firstName: string | null;
  hasPaid?: boolean;
}

export function NavbarUserMenu({ user, firstName, hasPaid }: NavbarUserMenuProps) {
  if (!user) {
    // Not logged in - show Login button (hidden on mobile)
    return (
      <>
        <Link href="/login" className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors">
          Login
        </Link>
        <Link href="/checkout?plan=individual-trial" className={`hidden md:inline-flex ${buttonClass("primary", "sm")}`}>
          Get Started
        </Link>
      </>
    );
  }

  // Logged in - show user menu with dropdown (hidden on mobile)
  return (
    <>
      <Link
        href={hasPaid ? "/seerah" : "/pricing"}
        className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors"
      >
        My Courses
      </Link>
      <NavbarUserButton firstName={firstName!} hasPaid={hasPaid} />
    </>
  );
}
