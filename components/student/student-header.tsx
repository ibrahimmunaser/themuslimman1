"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, User, BookOpen, CreditCard, Settings as SettingsIcon, LogOut, Zap } from "lucide-react";
import { signOut } from "@/lib/actions";

interface StudentHeaderProps {
  userFirstName: string;
  userPlan: "essentials" | "complete" | null;
}

export function StudentHeader({ userFirstName, userPlan: _userPlan }: StudentHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showUpgrade = false;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-zinc-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/60 transition-colors">
              <span className="text-amber-500 text-xs font-bold">T</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:inline">
              TheMuslimMan
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/my-courses" 
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              My Courses
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/help" 
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Help
            </Link>

            {/* Upgrade Button (Essentials only) */}
            {showUpgrade && (
              <Link
                href="/upgrade"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-sm font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-sm font-medium text-white"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-xs text-amber-500">{userFirstName[0]}</span>
                </div>
                <span className="hidden lg:inline">{userFirstName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-50">
                  <Link
                    href="/student/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                  <Link
                    href="/my-courses"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <BookOpen className="w-4 h-4" />
                    My Courses
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing / Upgrade
                  </Link>
                  <Link
                    href="/student/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="h-px bg-zinc-800 my-1" />
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-4 space-y-1">
            <Link
              href="/"
              className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/my-courses"
              className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Courses
            </Link>
            <Link
              href="/pricing"
              className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/help"
              className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Help
            </Link>

            {showUpgrade && (
              <Link
                href="/upgrade"
                className="block mx-4 my-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-sm font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade to Complete
                </div>
              </Link>
            )}

            <div className="h-px bg-zinc-800 my-2" />

            <Link
              href="/student/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-4 h-4" />
              My Account
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <CreditCard className="w-4 h-4" />
              Billing / Upgrade
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-900/50 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}
