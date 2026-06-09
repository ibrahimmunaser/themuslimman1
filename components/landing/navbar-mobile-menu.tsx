"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface NavbarMobileMenuProps {
  user: { fullName: string } | null;
  firstName: string | null;
}

export function NavbarMobileMenu({ user }: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Hamburger toggle — 44×44 tap target */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-text-secondary hover:text-text transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop — tap to close */}
          <div
            className="md:hidden fixed inset-0 top-16 sm:top-20 bg-black/40 z-40"
            onClick={close}
            aria-hidden
          />

          {/* Menu panel */}
          <nav
            id="mobile-nav"
            className="md:hidden fixed top-16 sm:top-20 left-0 right-0 border-t border-border bg-ink/98 backdrop-blur-xl z-50 flex flex-col"
          >
            <div className="flex flex-col py-2">
              <Link
                href="/"
                onClick={close}
                className="flex items-center px-5 min-h-[48px] text-sm text-text-secondary hover:text-text hover:bg-surface/50 transition-colors"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/seerah"
                  onClick={close}
                  className="flex items-center px-5 min-h-[48px] text-sm text-text-secondary hover:text-text hover:bg-surface/50 transition-colors"
                >
                  My Course
                </Link>
              )}
              <Link
                href="/pricing"
                onClick={close}
                className="flex items-center px-5 min-h-[48px] text-sm text-text-secondary hover:text-text hover:bg-surface/50 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href={user ? "/help" : "/contact"}
                onClick={close}
                className="flex items-center px-5 min-h-[48px] text-sm text-text-secondary hover:text-text hover:bg-surface/50 transition-colors"
              >
                Help
              </Link>

              <div className="mx-4 my-2 h-px bg-border/50" />

              {user ? (
                <Link
                  href="/student/settings"
                  onClick={close}
                  className="flex items-center px-5 min-h-[48px] text-sm text-text-secondary hover:text-text hover:bg-surface/50 transition-colors"
                >
                  Settings
                </Link>
              ) : (
                <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex items-center justify-center min-h-[48px] px-4 rounded-lg border border-border text-sm text-text-secondary hover:text-text hover:border-gold/30 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/checkout?plan=individual-trial"
                    onClick={close}
                    className="flex items-center justify-center min-h-[48px] px-4 rounded-lg bg-gold text-ink text-sm font-semibold hover:bg-gold-light transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
