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
    // Not logged in - show Login button
    return (
      <>
        <Link href="/login" className="text-sm text-text-secondary hover:text-text transition-colors">
          Login
        </Link>
        <Link href="#pricing" className={buttonClass("primary", "sm")}>
          Get Started
        </Link>
      </>
    );
  }

  // Logged in - show user menu with dropdown
  return (
    <>
      <Link href="/learn" className="text-sm text-text-secondary hover:text-text transition-colors">
        My Learning
      </Link>
      <NavbarUserButton firstName={firstName!} />
    </>
  );
}
