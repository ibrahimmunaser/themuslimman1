import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";

export async function Navbar() {
  let user = null;
  let firstName = null;
  
  try {
    user = await getCurrentUser();
    firstName = user ? user.fullName.split(" ")[0] : null;
  } catch (error) {
    if ((error as { digest?: string })?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("Navbar: Failed to get current user:", error);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/5 bg-ink/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logoicon.png"
              alt="TheMuslimMan"
              style={{ height: "56px", width: "auto", maxWidth: "none" }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-text-secondary hover:text-text transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-text-secondary hover:text-text transition-colors">
              Pricing
            </Link>
            <Link href={user ? "/help" : "/contact"} className="text-sm text-text-secondary hover:text-text transition-colors">
              Help
            </Link>
            <NavbarUserMenu user={user} firstName={firstName} />
          </div>

          {/* Mobile menu */}
          <NavbarMobileMenu user={user} firstName={firstName} />
        </nav>
      </div>
    </header>
  );
}
