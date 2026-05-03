"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { NavbarUserButton } from "./navbar-user-button";

interface NavbarUserMenuProps {
  user: any;
  firstName: string | null;
}

export function NavbarUserMenu({ user, firstName }: NavbarUserMenuProps) {
  if (!user) {
    // Not logged in - show Login button (hidden on mobile)
    return (
      <>
        <Link href="/login" className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors">
          Login
        </Link>
        <Link href="#pricing" className={`hidden md:inline-flex ${buttonClass("primary", "sm")}`}>
          Get Started
        </Link>
      </>
    );
  }

  // Logged in - show user menu with dropdown (hidden on mobile)
  return (
    <>
      <Link href="/my-courses" className="hidden md:block text-sm text-text-secondary hover:text-text transition-colors">
        My Courses
      </Link>
      <NavbarUserButton firstName={firstName!} />
    </>
  );
}
