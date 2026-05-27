"use client";

import { useState, useMemo } from "react";
import { PARTS } from "@/lib/content";
import { ERAS, type Era, type Part } from "@/lib/types";
import { ResourceFilterBar } from "./resource-filter-bar";

interface ResourcePageClientProps {
  children: (filteredParts: Part[]) => React.ReactNode;
  showStatusFilter?: boolean;
  filterByStatus?: (part: Part, status: string) => boolean;
}

export function ResourcePageClient({
  children,
  showStatusFilter = false,
  filterByStatus,
}: ResourcePageClientProps) {
  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedEra, setSelectedEra]   = useState<Era | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "completed" | "in-progress" | "not-started">("all");
  const [showFilters, setShowFilters]   = useState(false);

  const filteredParts = useMemo(() => {
    return PARTS.filter((part) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !part.title.toLowerCase().includes(q) &&
          !part.subtitle?.toLowerCase().includes(q) &&
          !part.partNumber.toString().includes(searchTerm)
        ) return false;
      }
      if (selectedEra !== "all" && part.era !== selectedEra) return false;
      if (showStatusFilter && filterByStatus && selectedStatus !== "all") {
        return filterByStatus(part, selectedStatus);
      }
      return true;
    });
  }, [searchTerm, selectedEra, selectedStatus, showStatusFilter, filterByStatus]);

  const partsByEra = useMemo(() => {
    const grouped: Record<Era, Part[]> = {} as Record<Era, Part[]>;
    ERAS.forEach((era) => { grouped[era.id] = []; });
    filteredParts.forEach((part) => { if (grouped[part.era]) grouped[part.era].push(part); });
    return grouped;
  }, [filteredParts]);

  return (
    <div className="space-y-6">
      <ResourceFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEra={selectedEra}
        onEraChange={setSelectedEra}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        showStatusFilter={showStatusFilter}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
      />

      {filteredParts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400">No results found</p>
          <p className="text-zinc-500 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : selectedEra === "all" ? (
        <div className="space-y-10 sm:space-y-14">
          {ERAS.map((era) => {
            const eraParts = partsByEra[era.id];
            if (!eraParts?.length) return null;
            return (
              <div key={era.id}>
                <div className="mb-4">
                  <h2 className="text-base sm:text-xl font-bold text-white">{era.label}</h2>
                  <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">{era.description}</p>
                </div>
                {children(eraParts)}
              </div>
            );
          })}
        </div>
      ) : (
        children(filteredParts)
      )}
    </div>
  );
}
