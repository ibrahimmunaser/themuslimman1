import type { Metadata } from "next";
import { Suspense } from "react";
import { StartPage } from "./start-page";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";

export const metadata: Metadata = {
  title: "Learn the Life of the Prophet ﷺ in Order | The Muslim Man",
  description:
    "Most Muslims know scattered stories. Start Part 1 free and learn the life of the Prophet ﷺ step by step — short videos, quizzes, flashcards, summaries, mind maps, and progress tracking.",
  openGraph: {
    title: "Learn the Life of the Prophet ﷺ in Order",
    description:
      "100-part structured course. Start Part 1 free — no credit card required.",
    siteName: "The Muslim Man",
  },
};

export default function StartRoute() {
  const preview = (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="h-5 bg-surface-raised rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-surface-raised rounded w-1/2 animate-pulse" />
            <div className="mt-4 aspect-video bg-surface-raised rounded-xl animate-pulse" />
          </div>
        </div>
      }
    >
      <Part1FullPreview hideCta />
    </Suspense>
  );

  return <StartPage preview={preview} />;
}
