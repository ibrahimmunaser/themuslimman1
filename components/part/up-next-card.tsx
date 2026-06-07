"use client";

import { useState, useEffect } from "react";

interface UpNextPart {
  partNumber: number;
  title?: string;
  subtitle?: string | null;
}

interface UpNextCardProps {
  completePath: UpNextPart | null;
  childrenPath: UpNextPart | null;
}

export function UpNextCard({ completePath, childrenPath }: UpNextCardProps) {
  const [activePath, setActivePath] = useState<"complete" | "children">("complete");

  useEffect(() => {
    try {
      // Children's Seerah path has been removed — clear any stale "children"
      // value so all users see the complete 100-part path.
      if (localStorage.getItem("seerah:lessons-path") === "children") {
        localStorage.removeItem("seerah:lessons-path");
      }
    } catch {
      // localStorage unavailable
    }
    // activePath stays "complete" — always show the complete-path Up Next card.
  }, []);

  const part = activePath === "children" ? (childrenPath ?? completePath) : completePath;
  if (!part) return null;

  return (
    <div className="mt-8 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl bg-gold/5 border border-gold/15">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gold/80 mb-1.5">Up Next</p>
      <p className="text-sm font-semibold text-text leading-snug line-clamp-2" style={{ hyphens: "none" }}>
        Part {part.partNumber}: {part.title}
      </p>
      {part.subtitle && (
        <p className="text-xs text-text-secondary/70 mt-0.5 leading-snug">{part.subtitle}</p>
      )}
    </div>
  );
}
