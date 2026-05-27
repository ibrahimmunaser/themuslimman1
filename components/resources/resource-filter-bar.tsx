"use client";

import { useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ERAS, type Era } from "@/lib/types";

interface ResourceFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEra: Era | "all";
  onEraChange: (era: Era | "all") => void;
  selectedStatus?: "all" | "completed" | "in-progress" | "not-started";
  onStatusChange?: (status: "all" | "completed" | "in-progress" | "not-started") => void;
  showStatusFilter?: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function ResourceFilterBar({
  searchTerm,
  onSearchChange,
  selectedEra,
  onEraChange,
  selectedStatus = "all",
  onStatusChange,
  showStatusFilter = false,
  showFilters,
  onToggleFilters,
}: ResourceFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount = [
    selectedEra !== "all" ? 1 : 0,
    showStatusFilter && selectedStatus !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {/* Search + Filter button in one row */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search lessons..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 pl-10 pr-14 py-3 min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/40 transition-colors"
        />
        {/* Clear search */}
        {searchTerm && (
          <button
            onClick={() => { onSearchChange(""); inputRef.current?.focus(); }}
            className="absolute right-11 top-1/2 -translate-y-1/2 min-w-[28px] min-h-[28px] flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Filter icon — integrated right side of search */}
        <button
          onClick={onToggleFilters}
          className={`absolute right-1 top-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg transition-colors ${
            showFilters || activeFilterCount > 0
              ? "text-amber-400 bg-amber-500/10"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          }`}
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          {/* Era Filter */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Stage / Era</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onEraChange("all")}
                className={`px-3 min-h-[36px] rounded-lg text-xs font-medium transition-colors ${
                  selectedEra === "all"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                }`}
              >
                All Stages
              </button>
              {ERAS.map((era) => (
                <button
                  key={era.id}
                  onClick={() => onEraChange(era.id)}
                  className={`px-3 min-h-[36px] rounded-lg text-xs font-medium transition-colors ${
                    selectedEra === era.id
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                  }`}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          {showStatusFilter && onStatusChange && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all" as const,         label: "All" },
                  { value: "completed" as const,    label: "Completed" },
                  { value: "in-progress" as const,  label: "In Progress" },
                  { value: "not-started" as const,  label: "Not Started" },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => onStatusChange(status.value)}
                    className={`px-3 min-h-[36px] rounded-lg text-xs font-medium transition-colors ${
                      selectedStatus === status.value
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                onEraChange("all");
                if (showStatusFilter && onStatusChange) onStatusChange("all");
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
