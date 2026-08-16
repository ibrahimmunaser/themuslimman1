"use client";

import dynamic from "next/dynamic";
import { LangToggle } from "@/components/part/lang-toggle";
import type { Part } from "@/lib/types";
import type { CourseLang } from "@/lib/course-lang";

interface Part1PreviewTabsProps {
  part: Part;
  initialAssetUrls: {
    videoUrl?: string;
    audioUrl?: string;
    mindmapUrl?: string;
    thumbnailUrl?: string;
  };
  /** Language the preview was rendered in — drives EN/AR UI + asset selection. */
  initialLang?: CourseLang;
  /** Hide the language toggle (e.g. when the parent already shows one). */
  hideLangToggle?: boolean;
}

const LazyPartTabs = dynamic(
  () => import("@/components/part/part-tabs").then((m) => ({ default: m.PartTabs })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border pb-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-20 rounded-lg bg-surface-raised animate-pulse" />
          ))}
        </div>
        <div className="aspect-video rounded-xl bg-surface-raised animate-pulse" />
      </div>
    ),
  },
);

export function Part1PreviewTabs({
  part,
  initialAssetUrls,
  initialLang = "en",
  hideLangToggle = false,
}: Part1PreviewTabsProps) {
  return (
    <div>
      {!hideLangToggle && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs text-text-muted">
            {initialLang === "ar" ? "لغة المعاينة" : "Preview language"}
          </p>
          <LangToggle current={initialLang} partNumber={1} />
        </div>
      )}
      <div dir={initialLang === "ar" ? "rtl" : undefined} key={initialLang}>
        <LazyPartTabs
          part={part}
          userPlan="essentials"
          previewMode={true}
          initialAssetUrls={initialAssetUrls}
          initialLang={initialLang}
        />
      </div>
    </div>
  );
}
