"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavbarUserMenu } from "./navbar-user-menu";

interface NavbarMobileMenuProps {
  user: any;
  firstName: string | null;
}

export function NavbarMobileMenu({ user, firstName }: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-text-secondary hover:text-text transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-border px-4 py-4 flex flex-col gap-4 bg-ink/95 backdrop-blur-xl">
          <Link 
            href="/" 
            onClick={() => setOpen(false)} 
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Home
          </Link>
          {user && (
            <Link 
              href="/my-courses" 
              onClick={() => setOpen(false)} 
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              My Courses
            </Link>
          )}
          <Link 
            href="/pricing" 
            onClick={() => setOpen(false)} 
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="/help" 
            onClick={() => setOpen(false)} 
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Help
          </Link>
          <div className="border-t border-border my-2" />
          {user ? (
            <Link 
              href="/student/settings" 
              onClick={() => setOpen(false)} 
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Settings
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                onClick={() => setOpen(false)} 
                className="text-sm text-text-secondary hover:text-text transition-colors"
              >
                Login
              </Link>
              <Link 
                href="#pricing" 
                onClick={() => setOpen(false)} 
                className="px-4 py-2 rounded-lg bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition-colors text-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
