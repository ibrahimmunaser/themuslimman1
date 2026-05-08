"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { ERAS, type Era } from "@/lib/types";

interface ResourceFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEra: Era | "all";
  onEraChange: (era: Era | "all") => void;
  selectedStatus?: "all" | "completed" | "in-progress" | "not-started";
  onStatusChange?: (status: "all" | "completed" | "in-progress" | "not-started") => void;
  showStatusFilter?: boolean;
}

export function ResourceFilterBar({
  searchTerm,
  onSearchChange,
  selectedEra,
  onEraChange,
  selectedStatus = "all",
  onStatusChange,
  showStatusFilter = false,
}: ResourceFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by part number or title..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors text-sm"
      >
        <Filter className="w-4 h-4" />
        Filters
        {(selectedEra !== "all" || (showStatusFilter && selectedStatus !== "all")) && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
            {[
              selectedEra !== "all" ? 1 : 0,
              showStatusFilter && selectedStatus !== "all" ? 1 : 0,
            ].reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          {/* Era Filter */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Era</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEraChange("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedEra === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                All Eras
              </button>
              {ERAS.map((era) => (
                <button
                  key={era.id}
                  onClick={() => onEraChange(era.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedEra === era.id
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
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
              <h3 className="text-sm font-medium text-white mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all" as const, label: "All" },
                  { value: "completed" as const, label: "Completed" },
                  { value: "in-progress" as const, label: "In Progress" },
                  { value: "not-started" as const, label: "Not Started" },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => onStatusChange(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedStatus === status.value
                        ? "bg-amber-500 text-black"
                        : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(selectedEra !== "all" || (showStatusFilter && selectedStatus !== "all")) && (
            <button
              onClick={() => {
                onEraChange("all");
                if (showStatusFilter && onStatusChange) {
                  onStatusChange("all");
                }
              }}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
