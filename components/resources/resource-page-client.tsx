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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "completed" | "in-progress" | "not-started">("all");

  const filteredParts = useMemo(() => {
    return PARTS.filter((part) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          part.title.toLowerCase().includes(searchLower) ||
          part.subtitle?.toLowerCase().includes(searchLower) ||
          part.partNumber.toString().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Era filter
      if (selectedEra !== "all" && part.era !== selectedEra) {
        return false;
      }

      // Status filter
      if (showStatusFilter && filterByStatus && selectedStatus !== "all") {
        return filterByStatus(part, selectedStatus);
      }

      return true;
    });
  }, [searchTerm, selectedEra, selectedStatus, showStatusFilter, filterByStatus]);

  // Group by era
  const partsByEra = useMemo(() => {
    const grouped: Record<Era, Part[]> = {} as Record<Era, Part[]>;
    
    ERAS.forEach((era) => {
      grouped[era.id] = [];
    });

    filteredParts.forEach((part) => {
      if (grouped[part.era]) {
        grouped[part.era].push(part);
      }
    });

    return grouped;
  }, [filteredParts]);

  return (
    <div className="space-y-8">
      <ResourceFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEra={selectedEra}
        onEraChange={setSelectedEra}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        showStatusFilter={showStatusFilter}
      />

      {filteredParts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-lg">No results found</p>
          <p className="text-zinc-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : selectedEra === "all" ? (
        // Show grouped by era
        <div className="space-y-12">
          {ERAS.map((era) => {
            const eraParts = partsByEra[era.id];
            if (!eraParts || eraParts.length === 0) return null;

            return (
              <div key={era.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{era.label}</h2>
                  <p className="text-zinc-400 text-sm">{era.description}</p>
                </div>
                {children(eraParts)}
              </div>
            );
          })}
        </div>
      ) : (
        // Show filtered results without grouping
        children(filteredParts)
      )}
    </div>
  );
}
