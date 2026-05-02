"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { Menu, X } from "lucide-react";
import { NavbarUserMenu } from "./navbar-user-menu";

export function NavbarMobileMenu() {
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
          <Link 
            href="/learn" 
            onClick={() => setOpen(false)} 
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            My Courses
          </Link>
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
          <Suspense fallback={<div className="text-sm text-text-secondary">Loading...</div>}>
            <NavbarUserMenu />
          </Suspense>
        </div>
      )}
    </>
  );
}
