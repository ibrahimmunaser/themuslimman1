import Link from "next/link";
import { Suspense } from "react";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarMobileMenu } from "./navbar-mobile-menu";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/5 bg-ink/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-colors">
              <span className="text-gold text-xs font-bold">T</span>
            </div>
            <span className="text-text font-semibold text-sm tracking-wide">
              The Muslim Man Academy
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-text-secondary hover:text-text transition-colors">
              Home
            </Link>
            <Link href="/learn" className="text-sm text-text-secondary hover:text-text transition-colors">
              My Courses
            </Link>
            <Link href="/pricing" className="text-sm text-text-secondary hover:text-text transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-sm text-text-secondary hover:text-text transition-colors">
              Help
            </Link>
            <Suspense fallback={
              <div className="text-sm text-text-secondary">Loading...</div>
            }>
              <NavbarUserMenu />
            </Suspense>
          </div>

          {/* Mobile menu */}
          <NavbarMobileMenu />
        </nav>
      </div>
    </header>
  );
}
