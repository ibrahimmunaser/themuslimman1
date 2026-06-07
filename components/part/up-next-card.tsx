"use client";

import { useEffect } from "react";

interface UpNextPart {
  partNumber: number;
  title?: string;
  subtitle?: string | null;
}

interface UpNextCardProps {
  completePath: UpNextPart | null;
}

export function UpNextCard({ completePath }: UpNextCardProps) {
  useEffect(() => {
    try {
      if (localStorage.getItem("seerah:lessons-path") === "children") {
        localStorage.removeItem("seerah:lessons-path");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!completePath) return null;

  return (
    <div className="mt-8 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl bg-gold/5 border border-gold/15">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gold/80 mb-1.5">Up Next</p>
      <p className="text-sm font-semibold text-text leading-snug line-clamp-2" style={{ hyphens: "none" }}>
        Part {completePath.partNumber}: {completePath.title}
      </p>
      {completePath.subtitle && (
        <p className="text-xs text-text-secondary/70 mt-0.5 leading-snug">{completePath.subtitle}</p>
      )}
    </div>
  );
}
