"use client";

import { useState, useEffect, useCallback } from "react";
import type { Part, AudiencePath } from "@/lib/types";
import { ERAS } from "@/lib/types";
import { LEARNING_PATHS } from "@/lib/learning-paths";
import { CurriculumView } from "./curriculum-view";

interface CurriculumPathSelectorProps {
  allParts: Part[];
}

const PATH_STORAGE_KEY = "seerah:curriculum-path";

export function CurriculumPathSelector({ allParts }: CurriculumPathSelectorProps) {
  const [activePath, setActivePath] = useState<AudiencePath>("complete");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PATH_STORAGE_KEY) as AudiencePath | null;
      if (saved && ["children", "complete"].includes(saved)) {
        setActivePath(saved);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const selectPath = useCallback((path: AudiencePath) => {
    setActivePath(path);
    try {
      localStorage.setItem(PATH_STORAGE_KEY, path);
    } catch {
      // ignore
    }
  }, []);

  const filteredParts = allParts.filter((p) => p.audiences.includes(activePath));

  const eraGroups = ERAS.map((era) => ({
    era,
    parts: filteredParts.filter((p) => p.era === era.id),
  })).filter((g) => g.parts.length > 0);

  return (
    <div>
      {/* Path selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {LEARNING_PATHS.map((path) => {
          const count = allParts.filter((p) => p.audiences.includes(path.id)).length;
          const isActive = activePath === path.id;
          return (
            <button
              key={path.id}
              onClick={() => selectPath(path.id)}
              className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                isActive
                  ? "border-gold/50 bg-gold/5 ring-1 ring-gold/20"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isActive ? "text-gold" : "text-text"
                  }`}
                >
                  {path.label}
                </span>
                <span
                  className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "bg-surface-raised text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isActive ? "text-text-secondary" : "text-text-muted"
                }`}
              >
                {path.description}
              </p>
            </button>
          );
        })}
      </div>

      <CurriculumView eraGroups={eraGroups} totalParts={filteredParts.length} />
    </div>
  );
}
