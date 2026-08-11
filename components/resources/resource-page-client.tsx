"use client";

import { useState, useMemo } from "react";
import { getPartsForLang, getErasForLang } from "@/lib/content";
import type { Era, Part } from "@/lib/types";
import type { CourseLang } from "@/lib/course-lang";
import { ResourceFilterBar } from "./resource-filter-bar";

interface ResourcePageClientProps {
  children: (filteredParts: Part[]) => React.ReactNode;
  showStatusFilter?: boolean;
  filterByStatus?: (part: Part, status: string) => boolean;
  lang?: CourseLang;
}

export function ResourcePageClient({
  children,
  showStatusFilter = false,
  filterByStatus,
  lang = "en",
}: ResourcePageClientProps) {
  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedEra, setSelectedEra]   = useState<Era | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "completed" | "in-progress" | "not-started">("all");
  const [showFilters, setShowFilters]   = useState(false);

  const parts = useMemo(() => getPartsForLang(lang), [lang]);
  const eras  = useMemo(() => getErasForLang(lang), [lang]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
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
  }, [parts, searchTerm, selectedEra, selectedStatus, showStatusFilter, filterByStatus]);

  const partsByEra = useMemo(() => {
    const grouped: Record<Era, Part[]> = {} as Record<Era, Part[]>;
    eras.forEach((era) => { grouped[era.id] = []; });
    filteredParts.forEach((part) => { if (grouped[part.era]) grouped[part.era].push(part); });
    return grouped;
  }, [filteredParts, eras]);

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : undefined}>
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
        eras={eras}
        lang={lang}
      />

      {filteredParts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400">{lang === "ar" ? "لا نتائج" : "No results found"}</p>
          <p className="text-zinc-500 text-sm mt-1">
            {lang === "ar" ? "جرّب تعديل عوامل التصفية" : "Try adjusting your filters"}
          </p>
        </div>
      ) : selectedEra === "all" ? (
        <div className="space-y-10 sm:space-y-14">
          {eras.map((era) => {
            const eraParts = partsByEra[era.id];
            if (!eraParts?.length) return null;
            return (
              <div key={era.id}>
                <div className="mb-4">
                  <h2 className="text-base sm:text-xl font-bold text-white">
                    {lang === "ar" ? (era.labelAr ?? era.label) : era.label}
                  </h2>
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
