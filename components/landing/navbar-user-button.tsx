"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";

export function NavbarUserButton({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        console.error("Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-gold/30 transition-all"
      >
        <User className="w-4 h-4 text-gold" />
        <span className="text-sm text-text font-medium">Welcome, {firstName}</span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-surface border border-border shadow-xl overflow-hidden z-20">
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-text hover:bg-surface-raised transition-colors"
            >
              My Courses
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-text hover:bg-surface-raised transition-colors"
            >
              Upgrade Plan
            </Link>
            <div className="border-t border-border" />
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-surface-raised transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
