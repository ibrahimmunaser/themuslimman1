"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { InfluencerConfig } from "@/lib/influencer-configs";
import type { Part } from "@/lib/types";
import type { Part1AssetUrls } from "@/lib/part1-preview-data";
import { Part1PreviewTabs } from "@/components/landing/part1-preview-tabs";

interface PreviewStepProps {
  config: InfluencerConfig;
  part: Part | null;
  initialAssetUrls: Part1AssetUrls;
  onBack: () => void;
  onContinue: () => void;
}


export function PreviewStep({
  config,
  part,
  initialAssetUrls,
  onBack,
  onContinue,
}: PreviewStepProps) {
  // PartTabs persists the active learning-format tab in the `?mode=` URL
  // param. Watch it here (without touching PartTabs itself) to fire a
  // tab-selection analytics event whenever the user switches formats.
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const prevModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (modeParam && modeParam !== prevModeRef.current) {
      if (prevModeRef.current !== null) {
        trackEvent(
          "part_1_content_tab_selected",
          { influencer_slug: config.slug, tab: modeParam },
          { allowDuplicates: true, creator: config.slug }
        );
      }
      prevModeRef.current = modeParam;
    }
  }, [modeParam, config.slug]);

  // VideoPlayer dispatches this global custom event on the first `play` —
  // reuse it instead of threading a new prop through PartTabs/VideoPlayer.
  useEffect(() => {
    const handler = () => {
      trackEvent(
        "part_1_video_started",
        { influencer_slug: config.slug },
        { creator: config.slug }
      );
    };
    window.addEventListener("seerah:videoPlaying", handler);
    return () => window.removeEventListener("seerah:videoPlaying", handler);
  }, [config.slug]);

  function handleContinue() {
    trackEvent(
      "influencer_preview_cta_clicked",
      { influencer_slug: config.slug, trigger: "preview_step_continue" },
      { creator: config.slug }
    );
    onContinue();
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-5 py-6 flex flex-col gap-6 flex-1">

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded min-h-[44px]"
          aria-label="Go back to overview"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        <div>
          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1">
            Free · No signup required
          </p>
          <h2 className="text-xl font-bold text-text">
            Part 1 — {part?.title ?? "The Beginning of Revelation"}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Watch, read, quiz, and review — see exactly how every lesson works.
          </p>
        </div>

        {part ? (
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-surface shadow-2xl shadow-black/50">
            <div className="px-3 sm:px-5 py-5">
              <Part1PreviewTabs part={part} initialAssetUrls={initialAssetUrls} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center">
            <p className="text-zinc-500 text-sm">Part 1 preview is temporarily unavailable.</p>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[52px]"
          aria-label="See full course plans and pricing"
        >
          See Full Course Plans
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <p className="text-xs text-zinc-500 text-center -mt-3">
          Unlock all 100 lessons — monthly and lifetime options available
        </p>

      </div>
    </div>
  );
}
