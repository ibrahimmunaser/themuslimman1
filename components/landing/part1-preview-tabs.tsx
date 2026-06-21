"use client";

import dynamic from "next/dynamic";
import type { Part } from "@/lib/types";

interface Part1PreviewTabsProps {
  part: Part;
  initialAssetUrls: {
    videoUrl?: string;
    audioUrl?: string;
    mindmapUrl?: string;
    thumbnailUrl?: string;
  };
}

// Lazy-load PartTabs and all its heavy dependencies (VideoPlayer, QuizViewer,
// SlidesViewer, MindmapViewer, FlashcardsViewer, etc.) into a separate JS chunk.
// The homepage/pricing page server components still stream the Part 1 data, but
// the large JS runtime for the tabs only downloads when this component mounts.
const LazyPartTabs = dynamic(
  () => import("@/components/part/part-tabs").then((m) => ({ default: m.PartTabs })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {/* Tab row skeleton */}
        <div className="flex gap-2 border-b border-border pb-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-20 rounded-lg bg-surface-raised animate-pulse" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="aspect-video rounded-xl bg-surface-raised animate-pulse" />
      </div>
    ),
  },
);

export function Part1PreviewTabs({ part, initialAssetUrls }: Part1PreviewTabsProps) {
  return (
    <LazyPartTabs
      part={part}
      userPlan="essentials"
      previewMode={true}
      initialAssetUrls={initialAssetUrls}
      hideTabNav={true}
    />
  );
}
